import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
const pid = '11111111-1111-4111-8111-111111111111'
const customer = { customer_name: 'Test', customer_email: 'test@example.invalid', customer_phone: '0700000000',
  payment_method: 'card', shipping_method: 'sameday', billing: { type: 'pf' }, shipping_address: {}, notes: '' }
const items = [{ id: pid, quantity: 2 }]
test('PostgreSQL migrations: atomic checkout, payment integrity and restrictive RLS', async t => {
  const db = new PGlite()
  try {
    for (const file of ['tests/fixtures/store-schema.sql', 'supabase/migrations/202611160001_secure_checkout.sql',
      'supabase/migrations/202611160002_access_and_privacy.sql', 'supabase/migrations/202611160003_private_print_files.sql',
      'supabase/migrations/202611160004_withdrawals.sql']) await db.exec(await readFile(file, 'utf8'))
    await db.query('insert into products(id,name,price,sale_price,stock,is_active) values($1,$2,50,40,5,true)', [pid,'Catalog item'])
    const create = async (cart: unknown = items, expected: number | null = 10000) => (await db.query<any>(
      'select create_secure_order($1::jsonb,$2::jsonb,null,$3,$4) as result', [JSON.stringify(customer),JSON.stringify(cart),'a'.repeat(64),expected])).rows[0].result
    let order: any
    await t.test('prices and names are read from the catalog, not cart fields', async () => {
      order = await create([{ ...items[0], price: 0.01, name: 'Forged', total_price: 0.02 }])
      assert.equal(Number(order.total),100)
      const row = (await db.query<any>('select * from order_items where order_id=$1',[order.orderId])).rows[0]
      assert.equal(row.product_name,'Catalog item'); assert.equal(Number(row.unit_price),40); assert.equal(Number(row.total_price),80)
    })
    await t.test('tampered totals, quantities, duplicates and stock shortages abort the transaction', async () => {
      for (const cart of [[],null,[{ id:pid,quantity:0 }],[{ id:pid,quantity:-1 }],[{ id:pid,quantity:1.5 }],
        [{ id:pid,quantity:6 }],[{ id:pid }],[items[0],items[0]]]) await assert.rejects(create(cart,null))
      await assert.rejects(create(items,1))
      assert.equal((await db.query<any>('select count(*)::int n from orders')).rows[0].n,1)
    })
    await t.test('failed line insertion rolls back the order and security record', async () => {
      await db.exec("create function fail_line() returns trigger language plpgsql as $$ begin raise exception 'test failure'; end $$; create trigger test_fail before insert on order_items for each row execute function fail_line();")
      await assert.rejects(create())
      assert.equal((await db.query<any>('select count(*)::int n from orders')).rows[0].n,1)
      await db.exec('drop trigger test_fail on order_items; drop function fail_line();')
    })
    let attempt: any
    await t.test('payment is bound to registered provider, transaction, currency and amount', async () => {
      attempt=(await db.query<any>("insert into payment_attempts(order_id,provider,provider_id,amount_cents,currency,status) values($1,'stripe','cs_test',10000,'ron','open') returning *",[order.orderId])).rows[0]
      for (const params of [['netopia','cs_test',10000,'ron'],['stripe','other',10000,'ron'],['stripe','cs_test',1,'ron'],['stripe','cs_test',10000,'eur'],
        [null,'cs_test',10000,'ron'],['stripe',null,10000,'ron'],['stripe','cs_test',null,'ron'],['stripe','cs_test',10000,null]]) {
        await assert.rejects(db.query('select record_verified_payment($1,$2,$3,$4,$5,$6,true)',[attempt.id,params[0],params[1],'forged',params[2],params[3]]))
      }
      assert.equal((await db.query<any>('select payment_status from orders where id=$1',[order.orderId])).rows[0].payment_status,'pending')
    })
    await t.test('duplicate and delayed notifications cannot downgrade a paid order', async () => {
      const call=(id:string,paid:boolean)=>db.query<any>("select record_verified_payment($1,'stripe','cs_test',$2,10000,'ron',$3) result",[attempt.id,id,paid])
      assert.equal((await call('evt_ok',true)).rows[0].result,true)
      assert.equal((await call('evt_ok',true)).rows[0].result,false)
      assert.equal((await call('evt_late_failure',false)).rows[0].result,false)
      assert.equal((await db.query<any>('select payment_status from orders where id=$1',[order.orderId])).rows[0].payment_status,'paid')
    })
    await t.test('anonymous and self-assigned user_metadata admin cannot write, view orders or call service RPCs', async () => {
      await db.exec('set role anon')
      assert.equal((await db.query('delete from products where id=$1 returning id',[pid])).rows.length,0)
      await assert.rejects(create())
      assert.equal((await db.query('select * from orders')).rows.length,0)
      await db.exec('reset role; set role authenticated')
      await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:'22222222-2222-4222-8222-222222222222',user_metadata:{role:'admin'},app_metadata:{}})])
      assert.equal((await db.query('update products set price=1 returning id')).rows.length,0)
      assert.equal((await db.query('select * from contact_requests')).rows.length,0)
      await assert.rejects(db.query('select * from order_security'))
      await db.exec('reset role')
    })
    await t.test('a server-controlled admin claim retains catalog administration', async () => {
      await db.exec('set role authenticated')
      await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({app_metadata:{role:'admin'}})])
      assert.equal((await db.query('update products set stock=5 returning id')).rows.length,1)
      await db.exec('reset role')
    })
    await t.test('private attachment policies constrain public grants without hiding product images', async () => {
      await db.exec("insert into storage.objects(bucket_id,name) values('products','image.jpg'),('products','print3d-requests/old.stl'),('print3d-requests','new/model.stl')")
      assert.equal((await db.query<any>("select public from storage.buckets where id='print3d-requests'")).rows[0].public,false)
      assert.equal((await db.query<any>("select public from storage.buckets where id='products'")).rows[0].public,true)
      await db.exec('set role anon')
      assert.deepEqual((await db.query<any>('select name from storage.objects')).rows.map(r=>r.name),['image.jpg'])
      for (const bucket of ['products','print3d-requests']) await assert.rejects(db.query('insert into storage.objects(bucket_id,name) values($1,$2)',[bucket,'print3d-requests/injected.stl']))
      await db.exec('reset role; set role service_role')
      assert.equal((await db.query('select * from storage.objects')).rows.length,3)
      await db.exec('reset role')
    })
    await t.test('withdrawal retries preserve timestamp and create a single inbox record', async () => {
      const args=['33333333-3333-4333-8333-333333333333','hash','Test','test@example.invalid','ORD-TEST','Declar retragerea.']
      const submit=()=>db.query<any>('select register_withdrawal($1,$2,$3,$4,$5,$6) result',args)
      const a=(await submit()).rows[0].result,b=(await submit()).rows[0].result
      assert.equal(a.id,b.id); assert.equal(a.submitted_at,b.submitted_at)
      assert.equal((await db.query<any>('select count(*)::int n from contact_requests')).rows[0].n,1)
      await assert.rejects(db.query('select register_withdrawal($1,$2,$3,$4,$5,$6)',[args[0],'different',...args.slice(2)]))
    })
  } finally { await db.close() }
})

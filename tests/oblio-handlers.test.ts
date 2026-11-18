import test from 'node:test'
import assert from 'node:assert/strict'
import { POST } from '../src/app/api/oblio/route'
test('authorized Oblio invoices use stored lines, 21% VAT and a single stock path; retries do not reissue',async()=>{
 const previous={...process.env},oldFetch=globalThis.fetch
 Object.assign(process.env,{NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:19876',SUPABASE_SERVICE_KEY:'mock',OBLIO_CLIENT_ID:'test',OBLIO_CLIENT_SECRET:'test',OBLIO_CIF:'test',OBLIO_INVOICE_SERIES:'TEST',OBLIO_STOCK_DOCUMENT:'invoice',OBLIO_VAT_PERCENTAGE:'21'})
 const id='11111111-1111-4111-8111-111111111111'
 const order:any={id,order_number:'ORD-TEST',customer_name:'Test',customer_email:'test@example.invalid',status:'processing',payment_method:'card',payment_status:'paid',shipping_method:'sameday',shipping_cost:20,total_amount:100,
  order_items:[{product_id:id,product_name:'Stored product',quantity:2,unit_price:40,total_price:80}]}
 let documents=0,payload:any,claimed=false
 globalThis.fetch=(async(url:any,options:any={})=>{const u=new URL(String(url))
  if(u.pathname==='/auth/v1/user')return Response.json({id,app_metadata:{role:'admin'}})
  if(u.pathname.endsWith('/orders')){if(options.method==='PATCH'){Object.assign(order,JSON.parse(options.body));return new Response(null,{status:204})}return Response.json(order)}
  if(u.pathname.endsWith('/order_security'))return Response.json([{amount_cents:10000}])
  if(u.pathname.endsWith('/products'))return Response.json([{id,sku:'TRUSTED-SKU'}])
  if(u.pathname.endsWith('/oblio_operations')){if(options.method==='PATCH')return new Response(null,{status:204});if(claimed)return Response.json({code:'23505'},{status:409});claimed=true;return new Response(null,{status:201})}
  if(u.hostname==='www.oblio.eu'&&u.pathname.endsWith('/authorize/token'))return Response.json({access_token:'local-token'})
  if(u.hostname==='www.oblio.eu'&&u.pathname.endsWith('/docs/invoice')){documents++;payload=JSON.parse(options.body);return Response.json({status:200,data:{seriesName:'TEST',number:'1'}})}
  throw Error('Unexpected request: '+u.pathname)
 }) as typeof fetch
 const send=(action:string)=>POST(new Request('http://localhost/api/oblio',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer mock-session'},body:JSON.stringify({action,orderId:id,items:[{name:'Forged',quantity:999,price:0.01}]})}))
 try{
  assert.equal((await send('create-invoice')).status,200);assert.equal(documents,1);assert.equal(payload.useStock,1)
  assert.equal(payload.products[0].price,40);assert.equal(payload.products[0].quantity,2);assert.equal(payload.products[0].code,'TRUSTED-SKU')
  assert.equal(payload.products[0].vatPercentage,21);assert.equal(payload.products[0].vatIncluded,true);assert.equal(payload.products[1].price,20)
  assert.equal((await(await send('create-invoice')).json()).alreadyIssued,true)
  assert.equal((await send('decrease-stock')).status,409);assert.equal(documents,1)
  delete order.invoice
  assert.equal((await send('create-invoice')).status,409);assert.equal(documents,1)
 }finally{globalThis.fetch=oldFetch;process.env=previous}
})

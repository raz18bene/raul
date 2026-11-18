import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { getStripe } from '../src/lib/stripe'
import { POST as webhook } from '../src/app/api/stripe/webhook/route'
import { POST as start } from '../src/app/api/stripe/route'
import { POST as createOrder } from '../src/app/api/orders/route'
const id='11111111-1111-4111-8111-111111111111',token='a'.repeat(64)
const order:any={id,order_number:'ORD-TEST',customer_email:'test@example.invalid',payment_method:'card',payment_status:'pending',status:'pending',total_amount:100,shipping_method:'sameday',shipping_cost:20,
 order_items:[{product_name:'Trusted catalog product',quantity:2,unit_price:40,total_price:80}]}
const attempt:any={id:'22222222-2222-4222-8222-222222222222',order_id:id,provider:'stripe',provider_id:'cs_test',amount_cents:10000,currency:'ron',status:'open',created_at:new Date().toISOString()}
const base:any={id:'cs_test',mode:'payment',status:'complete',payment_status:'paid',livemode:false,currency:'ron',amount_total:10000,
 client_reference_id:order.order_number,metadata:{orderId:id,attemptId:attempt.id}}
function configure(){Object.assign(process.env,{STRIPE_SECRET_KEY:'sk_test_mock',STRIPE_WEBHOOK_SECRET:'whsec_mock',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:19876',SUPABASE_SERVICE_KEY:'mock',RESEND_API_KEY:''})}
test('order handler sends trusted fields to the atomic RPC and survives profile failure after saving',async()=>{
 const previous={...process.env},oldFetch=globalThis.fetch;configure()
 let rpcBody:any,dbFailure=false
 globalThis.fetch=(async(url:any,options:any)=>{const path=new URL(String(url)).pathname
  if(path==='/auth/v1/user')return Response.json({id,app_metadata:{}})
  if(path.endsWith('/rpc/create_secure_order')){rpcBody=JSON.parse(options.body);return dbFailure?Response.json({code:'22023'},{status:400}):Response.json({orderId:id,orderNumber:'ORD-TEST',total:100})}
  if(path.endsWith('/profiles'))throw Error('simulated profile network failure')
  throw Error('Unexpected request: '+path)
 }) as typeof fetch
 const send=()=>createOrder(new Request('http://localhost/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
  accessToken:'mock-session',userId:'attacker',customerName:'Test',customerEmail:'test@example.invalid',customerPhone:'0700000000',
  shippingMethod:'sediu',paymentMethod:'card',items:[{id,quantity:2,price:0.01,name:'Forged'}],payment_status:'paid',total:100,
 })}))
 try{
  const response=await send();assert.equal(response.status,200)
  const body=await response.json();assert.match(body.checkoutToken,/^[a-f0-9]{64}$/)
  assert.equal(rpcBody.p_token_hash,createHash('sha256').update(body.checkoutToken).digest('hex'))
  assert.deepEqual(rpcBody.p_items,[{id,quantity:2}]);assert.equal(rpcBody.p_user_id,id)
  assert.equal(rpcBody.p_customer.payment_status,undefined);assert.equal(rpcBody.p_expected_total,10000)
  dbFailure=true;assert.equal((await send()).status,409)
 }finally{globalThis.fetch=oldFetch;process.env=previous}
})
test('Stripe webhook rejects invalid signatures, unpaid sessions and DB failures',async()=>{
 const previous={...process.env},oldFetch=globalThis.fetch;configure()
 const stripe=getStripe(),oldRetrieve=stripe.checkout.sessions.retrieve
 let session={...base},writes=0,dbFailure=false
 stripe.checkout.sessions.retrieve=(async()=>session) as any
 globalThis.fetch=(async(url:any)=>{const path=new URL(String(url)).pathname
  if(path.endsWith('/payment_attempts'))return Response.json([attempt])
  if(path.endsWith('/orders'))return Response.json(order)
  if(path.endsWith('/rpc/record_verified_payment')){writes++;return dbFailure?Response.json({code:'08006'},{status:503}):Response.json(true)}
  throw Error('Unexpected request: '+path)
 }) as typeof fetch
 const send=(valid=true)=>{const payload=JSON.stringify({id:'evt_test',type:'checkout.session.completed',data:{object:{id:'cs_test'}}})
  const signature=valid?stripe.webhooks.generateTestHeaderString({payload,secret:'whsec_mock'}):'invalid'
  return webhook(new Request('http://localhost/api/stripe/webhook',{method:'POST',headers:{'stripe-signature':signature},body:payload}))}
 try{
  assert.equal((await send(false)).status,400);assert.equal(writes,0)
  session={...base,payment_status:'unpaid'};assert.equal((await send()).status,200);assert.equal(writes,0)
  session={...base,amount_total:1};assert.equal((await send()).status,400);assert.equal(writes,0)
  session={...base};dbFailure=true;assert.equal((await send()).status,503)
  dbFailure=false;assert.equal((await send()).status,200);assert.equal(writes,2)
 }finally{stripe.checkout.sessions.retrieve=oldRetrieve;globalThis.fetch=oldFetch;process.env=previous}
})
test('Stripe checkout ignores browser totals and uses stored order line items and canonical redirects',async()=>{
 const previous={...process.env},oldFetch=globalThis.fetch;configure()
 const stripe=getStripe(),oldCreate=stripe.checkout.sessions.create
 let created:any
 stripe.checkout.sessions.create=(async(payload:any,options:any)=>{created={payload,options};return {...base,status:'open',url:'https://checkout.stripe.com/test'}}) as any
 globalThis.fetch=(async(url:any,options:any)=>{const path=new URL(String(url)).pathname
  if(path.endsWith('/order_security'))return Response.json([{order_id:id,amount_cents:10000,currency:'ron',token_hash:createHash('sha256').update(token).digest('hex')}])
  if(path.endsWith('/orders'))return Response.json(order)
  if(path.endsWith('/payment_attempts'))return options.method==='PATCH'?new Response(null,{status:204}):Response.json({...attempt,provider_id:null,status:'creating'})
  throw Error('Unexpected request: '+path)
 }) as typeof fetch
 try{
  const response=await start(new Request('http://localhost/api/stripe',{method:'POST',headers:{'Content-Type':'application/json',host:'attacker.invalid'},body:JSON.stringify({orderId:id,checkoutToken:token,total:0.01,shippingCost:0,items:[{name:'Fake',price:0.01,quantity:1}]})}))
  assert.equal(response.status,200)
  assert.equal(created.payload.line_items[0].price_data.unit_amount,4000);assert.equal(created.payload.line_items[0].quantity,2)
  assert.equal(created.payload.line_items[1].price_data.unit_amount,2000)
  assert.match(created.payload.success_url,/^https:\/\/www.technestprototyping.ro\//)
  assert.equal(created.options.idempotencyKey,`technest-${attempt.id}`)
 }finally{stripe.checkout.sessions.create=oldCreate;globalThis.fetch=oldFetch;process.env=previous}
})

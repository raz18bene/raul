import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { generateKeyPair, exportSPKI, SignJWT } from 'jose'
import { POST as addProduct, PUT as updateProduct, DELETE as deleteProduct } from '../src/app/api/products/route'
import { POST as oblioPost, GET as oblioGet } from '../src/app/api/oblio/route'
import { POST as stripeStart } from '../src/app/api/stripe/route'
import { POST as netopiaCallback } from '../src/app/api/netopia/callback/route'
import { POST as netopiaStart } from '../src/app/api/netopia/route'
import { GET as privateDownload } from '../src/app/api/print3d-files/route'
import { POST as withdrawalRetry } from '../src/app/api/withdrawals/confirmations/route'
import { POST as samedayPost, GET as samedayGet } from '../src/app/api/sameday/route'
import { checkoutInput, storedOrderTotal } from '../src/lib/checkout'
import { tokenMatches, validateStripeSession } from '../src/lib/payments'
import { verifyNetopia, validateNetopiaPayment } from '../src/lib/netopia-verification'
import { attachmentProof, verifyAttachment } from '../src/lib/private-files'
import { standardVat } from '../src/lib/vat'
import { stockDocument } from '../src/lib/oblio-stock'
const order:any={id:'11111111-1111-4111-8111-111111111111',order_number:'ORD-TEST',payment_method:'card',total_amount:100,shipping_method:'sameday',shipping_cost:20,
  order_items:[{product_name:'Catalog',unit_price:40,quantity:2,total_price:80}]}
const attempt:any={id:'attempt',order_id:order.id,provider:'stripe',provider_id:'cs_test',amount_cents:10000,currency:'ron'}
const session:any={id:'cs_test',mode:'payment',livemode:false,currency:'ron',amount_total:10000,client_reference_id:'ORD-TEST',metadata:{orderId:order.id,attemptId:'attempt'}}
const request=(body:any={},token?:string)=>new Request('http://localhost/api/test',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)})
test('privileged endpoints reject missing authorization before database/provider mutation',async()=>{
  for(const handler of [addProduct,updateProduct,deleteProduct,oblioPost,privateDownload,withdrawalRetry]) assert.equal((await handler(request())).status,401)
  for(const action of ['test','sync-stock']) assert.equal((await oblioGet(new Request(`http://localhost/api/oblio?action=${action}`))).status,401)
  for(const action of ['create-invoice','decrease-stock','sync-stock']) assert.equal((await oblioPost(request({action}))).status,401)
  assert.equal((await stripeStart(request({orderId:order.id,total:0.01}))).status,401)
  assert.equal((await netopiaCallback(request({order:{orderID:'ORD-TEST',status:3}}))).status,400)
  assert.equal((await netopiaStart()).status,503)
  assert.equal((await samedayGet(new Request('http://localhost/api/sameday?action=test'))).status,401)
  assert.equal((await samedayPost(request({action:'create-awb'}))).status,401)
})
test('server authorization ignores self-assigned user_metadata admin',async()=>{
  const oldFetch=globalThis.fetch,oldEnv={...process.env}
  process.env.NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:19876';process.env.SUPABASE_SERVICE_KEY='mock'
  let calls=0
  globalThis.fetch=(async()=>{calls++;return Response.json({id:order.id,app_metadata:{},user_metadata:{role:'admin'}})}) as typeof fetch
  try{assert.equal((await deleteProduct(request({id:order.id},'fake-session'))).status,403);assert.equal(calls,1)}
  finally{globalThis.fetch=oldFetch;process.env=oldEnv}
})
test('checkout accepts IDs and integer quantities and rejects shipping manipulation',()=>{
  const raw={customerName:'Test',customerEmail:'test@example.invalid',customerPhone:'0700000000',shippingMethod:'sediu',paymentMethod:'card',items:[{id:order.id,quantity:1,price:0.01}],total:0.01}
  assert.deepEqual(checkoutInput(raw).items,[{id:order.id,quantity:1}])
  for(const quantity of [0,-1,1.5,'2',Infinity,1000])assert.throws(()=>checkoutInput({...raw,items:[{id:order.id,quantity}]}))
  assert.throws(()=>checkoutInput({...raw,shippingCost:20})); assert.throws(()=>storedOrderTotal({...order,total_amount:0.01}))
})
test('guest checkout tokens must match their stored hash',()=>{
  const token='b'.repeat(64),hash=createHash('sha256').update(token).digest('hex')
  assert.ok(tokenMatches(token,hash));assert.ok(!tokenMatches('c'.repeat(64),hash));assert.ok(!tokenMatches('',hash));assert.ok(!tokenMatches(token,null))
})
test('Stripe concordance rejects other orders, amounts, currency, mode, environment and sessions',()=>{
  assert.doesNotThrow(()=>validateStripeSession(session,attempt,order,false))
  for(const patch of [{id:'other'},{amount_total:1},{currency:'eur'},{livemode:true},{mode:'setup'},{client_reference_id:'other'},{metadata:{orderId:'other',attemptId:'attempt'}},{metadata:{orderId:order.id,attemptId:'other'}}])assert.throws(()=>validateStripeSession({...session,...patch},attempt,order,false))
})
test('Netopia requires RS512 authenticity, correct claims and the exact raw body',async()=>{
  const keys=await generateKeyPair('RS512'),pem=await exportSPKI(keys.publicKey)
  const raw=JSON.stringify({payment:{status:5,ntpID:'ntp',amount:100,currency:'RON'},order:{orderID:'ORD-TEST'}})
  const sign=(claims:any={},body=raw)=>new SignJWT({iss:'NETOPIA Payments',aud:'POS',sub:createHash('sha512').update(body).digest('base64'),iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+120,...claims}).setProtectedHeader({alg:'RS512'}).sign(keys.privateKey)
  assert.equal((await verifyNetopia(raw,await sign(),pem,'POS')).payment.status,5)
  for(const claims of [{aud:'OTHER'},{iss:'attacker'},{exp:1},{sub:'forged'}])await assert.rejects(verifyNetopia(raw,await sign(claims),pem,'POS'))
  await assert.rejects(verifyNetopia(raw+' ',await sign(),pem,'POS'));await assert.rejects(verifyNetopia(raw,null,pem,'POS'))
  await assert.rejects(verifyNetopia(raw,await sign(),'','POS'))
  const body=JSON.parse(raw),ntp={...attempt,provider:'netopia',provider_id:'ntp'}
  assert.equal(validateNetopiaPayment(body,ntp,order),'paid')
  assert.equal(validateNetopiaPayment({...body,payment:{...body.payment,status:1}},ntp,order),'review')
  assert.throws(()=>validateNetopiaPayment({...body,payment:{...body.payment,amount:1}},ntp,order))
  assert.throws(()=>validateNetopiaPayment({...body,order:{orderID:'other'}},ntp,order))
})
test('private attachment proofs reject path changes, malformed proofs and expiration',()=>{
  const old={...process.env};process.env.PRINT3D_UPLOAD_SECRET='local-test-secret'.repeat(3)
  try{const path=order.id+'/model.stl',proof=attachmentProof(path,Date.now()+100000);assert.equal(verifyAttachment(path,proof),path)
    assert.throws(()=>verifyAttachment(path.replace('model','other'),proof));assert.throws(()=>verifyAttachment('../model.stl',proof))
    assert.throws(()=>verifyAttachment(path,proof+'.extra'));assert.throws(()=>verifyAttachment(path,attachmentProof(path,Date.now()-1000)))}
  finally{process.env=old}
})
test('Oblio VAT defaults to 21% and refuses stale 19% settings',()=>{
  const old={...process.env}
  try{delete process.env.OBLIO_VAT_PERCENTAGE;assert.equal(standardVat().vatPercentage,21);process.env.OBLIO_VAT_PERCENTAGE='19';assert.throws(()=>standardVat())}
  finally{process.env=old}
})
test('Oblio has one stock document owner and rejects ambiguous configuration',()=>{
  const old={...process.env}
  try{delete process.env.OBLIO_STOCK_DOCUMENT;assert.equal(stockDocument(),'invoice');process.env.OBLIO_STOCK_DOCUMENT='notice';assert.equal(stockDocument(),'notice')
    process.env.OBLIO_STOCK_DOCUMENT='both';assert.throws(()=>stockDocument())}
  finally{process.env=old}
})

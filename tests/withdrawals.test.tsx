import React from 'react'
import test from 'node:test'
import assert from 'node:assert/strict'
import { create, act, ReactTestRenderer } from 'react-test-renderer'
import Page from '../src/app/politica-retur/page'
import { withdrawalInput, withdrawalReceipt } from '../src/lib/withdrawals'
test('withdrawal requires identity, contract and explicit confirmation; never requires a reason or IBAN',()=>{
 const raw={name:'Test',email:'test@example.invalid',contract:'ORD-TEST',requestKey:'33333333-3333-4333-8333-333333333333',confirm:true}
 const body=withdrawalInput(raw);assert.match(body.message,/Declar retragerea/)
 for(const patch of [{confirm:false},{name:''},{email:''},{contract:''}])assert.throws(()=>withdrawalInput({...raw,...patch}))
 const receipt=withdrawalReceipt({...body,id:'receipt',submitted_at:'2026-11-17T12:00:00Z'})
 assert.match(receipt,/2026-11-17T12:00:00.000Z/);assert.match(receipt,/ORD-TEST/);assert.match(receipt,/Declarație/)
})
test('withdrawal review precedes sending; failed retries preserve key and success offers a dated durable receipt',async()=>{
 const oldFetch=globalThis.fetch;let renderer:ReactTestRenderer;const bodies:any[]=[]
 globalThis.fetch=(async(_url:any,options:any)=>{bodies.push(JSON.parse(options.body));return bodies.length===1?Response.json({success:false},{status:503}):Response.json({success:true,id:'receipt-id',receipt:'Confirmare 2026-11-17T12:00:00Z',emailSent:false})}) as typeof fetch
 try{
  await act(async()=>{renderer=create(<Page/>)})
  let root=renderer!.root
  await act(async()=>{const inputs=root.findAllByType('input');inputs[0].props.onChange({target:{value:'Test'}});inputs[1].props.onChange({target:{value:'test@example.invalid'}});root.findAllByType('textarea')[0].props.onChange({target:{value:'ORD-TEST'}})})
  await act(async()=>{root.findByType('form').props.onSubmit({preventDefault(){}})})
  assert.equal(bodies.length,0)
  const confirm=()=>root.findAllByType('button').find(b=>b.children.includes('Confirmă retragerea'))!
  await act(async()=>{await confirm().props.onClick()})
  assert.equal(bodies.length,1);assert.match(JSON.stringify(renderer!.toJSON()),/nu a putut fi confirmată/)
  await act(async()=>{await confirm().props.onClick()})
  assert.equal(bodies[0].requestKey,bodies[1].requestKey)
  const download=root.findAllByType('a').find(a=>a.props.download)!
  assert.match(download.props.href,/data:text\/plain/);assert.match(JSON.stringify(renderer!.toJSON()),/Emailul de confirmare este în așteptare/)
 }finally{globalThis.fetch=oldFetch;await act(async()=>renderer?.unmount())}
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { rememberCheckout, rememberedCheckout } from '../src/lib/checkout-storage'
test('delivery details require opt-in, expire, exclude tokens and remove legacy browser copies',()=>{
 let value:string|null=null
 const storage={getItem:()=>value,setItem:(_:string,data:string)=>{value=data},removeItem:()=>{value=null}}
 const data={name:'Test',email:'test@example.invalid',accessToken:'secret',notes:'private note'}
 rememberCheckout(storage,data,false);assert.equal(value,null)
 rememberCheckout(storage,data,true);assert.deepEqual(rememberedCheckout(storage),{name:data.name,email:data.email});assert.doesNotMatch(value!,/secret|private note/)
 value=JSON.stringify({consent:true,expires:Date.now()-1,data});assert.equal(rememberedCheckout(storage),null);assert.equal(value,null)
 value=JSON.stringify(data);assert.equal(rememberedCheckout(storage),null);assert.equal(value,null)
 rememberCheckout(storage,data,true);rememberCheckout(storage,data,false);assert.equal(value,null)
})

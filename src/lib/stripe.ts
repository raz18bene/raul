import Stripe from 'stripe'

let _stripe: Stripe | null = null

// Client Stripe, folosit DOAR pe server (in rutele /api) — nu importa asta in cod de client.
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY nu este setat')
    _stripe = new Stripe(key)
  }
  return _stripe
}

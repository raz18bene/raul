'use client'
import { useRef, useState } from 'react'
import { CONTACT_FAILURE, submitContact } from '@/lib/contact'

export function useContactSubmission() {
  const busy = useRef(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(prepare: () => unknown | Promise<unknown>) {
    if (busy.current) return
    busy.current = true
    setSending(true)
    setError('')
    try {
      const body = await prepare()
      await submitContact(body)
      setSent(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : CONTACT_FAILURE)
    } finally {
      busy.current = false
      setSending(false)
    }
  }
  return { sending, sent, error, submit, reset: () => { setSent(false); setError('') } }
}

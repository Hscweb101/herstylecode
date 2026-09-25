import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Faq as FaqType } from '@/types'
import { FullPageSpinner } from '@/components/ui/Misc'

function FaqItem({ faq }: { faq: FaqType }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-blush-100 py-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left">
        <span className="font-medium text-ink-900">{faq.question}</span>
        <span className="ml-4 text-brand-500">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="mt-2 text-sm text-ink-500">{faq.answer}</p>}
    </div>
  )
}

export default function Faq() {
  const [faqs, setFaqs] = useState<FaqType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        setFaqs((data as FaqType[]) ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) return <FullPageSpinner />

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 md:px-8">
      <h1 className="mb-8 text-center font-serif text-3xl">Frequently Asked Questions</h1>
      <div>
        {faqs.map((f) => <FaqItem key={f.id} faq={f} />)}
      </div>
    </div>
  )
}

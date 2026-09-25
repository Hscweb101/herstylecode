import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader, Card, IconButton } from '@/components/admin/AdminUI'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FullPageSpinner } from '@/components/ui/Misc'
import { cn } from '@/lib/utils'
import type { StaticPage, Faq } from '@/types'

function StaticPagesEditor() {
  const [pages, setPages] = useState<StaticPage[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    // The About page is built into the storefront (AboutUs.tsx), so its old text entry isn't offered for editing here.
    const { data } = await supabase.from('static_pages').select('*').neq('slug', 'about-us').order('title')
    const rows = (data as StaticPage[]) ?? []
    setPages(rows)
    if (rows.length > 0 && !activeId) {
      setActiveId(rows[0].id)
      setContent(rows[0].content)
      setTitle(rows[0].title)
    }
    setLoading(false)
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectPage = (p: StaticPage) => {
    setActiveId(p.id)
    setContent(p.content)
    setTitle(p.title)
  }

  const handleSave = async () => {
    if (!activeId) return
    setSaving(true)
    const { error } = await supabase.from('static_pages').update({ title, content }).eq('id', activeId)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Page updated')
    load()
  }

  if (loading) return <FullPageSpinner />

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <div className="space-y-1">
        {pages.map((p) => (
          <button
            key={p.id}
            onClick={() => selectPage(p)}
            className={cn('block w-full rounded-xl px-3 py-2 text-left text-sm', activeId === p.id ? 'bg-brand-600 text-white' : 'text-ink-700 hover:bg-blush-50')}
          >
            {p.title}
          </button>
        ))}
      </div>
      <Card>
        <Input label="Page Title" value={title} onChange={(e) => setTitle(e.target.value)} className="mb-4" />
        <Textarea label="Content (HTML supported)" value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[320px]" />
        <Button className="mt-4" onClick={handleSave} loading={saving}>Save Page</Button>
      </Card>
    </div>
  )
}

function FaqsEditor() {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' })

  const load = () => {
    supabase.from('faqs').select('*').order('sort_order').then(({ data }) => {
      setFaqs((data as Faq[]) ?? [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const handleAdd = async () => {
    if (!newFaq.question || !newFaq.answer) return
    await supabase.from('faqs').insert({ ...newFaq, sort_order: faqs.length })
    setNewFaq({ question: '', answer: '' })
    load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('faqs').delete().eq('id', id)
    load()
  }

  if (loading) return <FullPageSpinner />

  return (
    <Card>
      <div className="space-y-3">
        {faqs.map((f) => (
          <div key={f.id} className="flex items-start justify-between border-b border-blush-50 pb-3">
            <div>
              <p className="text-sm font-medium">{f.question}</p>
              <p className="text-xs text-ink-500">{f.answer}</p>
            </div>
            <IconButton onClick={() => handleDelete(f.id)}><Trash2 size={15} /></IconButton>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <Input placeholder="New question" value={newFaq.question} onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })} />
        <Textarea placeholder="Answer" value={newFaq.answer} onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })} />
        <Button variant="outline" onClick={handleAdd}><Plus size={14} /> Add FAQ</Button>
      </div>
    </Card>
  )
}

export default function PagesAdmin() {
  const [tab, setTab] = useState<'pages' | 'faqs'>('pages')
  return (
    <div>
      <PageHeader title="Content Pages" description="Legal pages, Contact info & FAQs" />
      <div className="mb-6 flex gap-2">
        <Button variant={tab === 'pages' ? 'primary' : 'outline'} size="sm" onClick={() => setTab('pages')}>Static Pages</Button>
        <Button variant={tab === 'faqs' ? 'primary' : 'outline'} size="sm" onClick={() => setTab('faqs')}>FAQs</Button>
      </div>
      {tab === 'pages' ? <StaticPagesEditor /> : <FaqsEditor />}
    </div>
  )
}

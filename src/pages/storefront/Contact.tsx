import { useState } from 'react'
import toast from 'react-hot-toast'
import { Mail, Phone, MessageCircle, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function Contact() {
  const { settings } = useStoreSettings()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const whatsapp = settings.store_info.whatsapp_number.replace(/[^0-9]/g, '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from('contact_messages').insert(form)
    setSubmitting(false)
    if (error) {
      toast.error('Could not send message. Please try again.')
      return
    }
    toast.success("Message sent! We'll get back to you soon.")
    setForm({ name: '', email: '', phone: '', message: '' })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 md:px-8">
      <h1 className="mb-8 text-center font-serif text-3xl">Contact Us</h1>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-luxe-sm">
            <Mail className="text-brand-500" />
            <div>
              <p className="text-xs text-ink-300">Email</p>
              <p className="text-sm font-medium">{settings.store_info.support_email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-luxe-sm">
            <Phone className="text-brand-500" />
            <div>
              <p className="text-xs text-ink-300">Phone</p>
              <p className="text-sm font-medium">{settings.store_info.support_phone}</p>
            </div>
          </div>
          {settings.store_info.address && (
            <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-luxe-sm">
              <MapPin className="text-brand-500" />
              <div>
                <p className="text-xs text-ink-300">Address</p>
                <p className="text-sm font-medium">{settings.store_info.address}</p>
              </div>
            </div>
          )}
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-luxe-sm transition-colors hover:bg-[#25D366]/5"
            >
              <MessageCircle className="text-[#25D366]" />
              <div>
                <p className="text-xs text-ink-300">WhatsApp us</p>
                <p className="text-sm font-medium">{settings.store_info.whatsapp_number}</p>
              </div>
            </a>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-luxe-sm">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Textarea label="Message" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <Button type="submit" className="w-full" loading={submitting}>Send Message</Button>
        </form>
      </div>
    </div>
  )
}

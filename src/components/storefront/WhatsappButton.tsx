import { MessageCircle } from 'lucide-react'
import { useStoreSettings } from '@/hooks/useStoreSettings'

export function WhatsappButton() {
  const { settings } = useStoreSettings()
  const number = settings.store_info.whatsapp_number.replace(/[^0-9]/g, '')
  if (!number) return null

  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent('Hi HerStyleCode, I have a question about your jewellery!')}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="whatsapp-fab fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] p-3.5 text-white shadow-luxe transition-transform hover:scale-110"
    >
      <MessageCircle size={24} className="fill-white text-[#25D366]" />
    </a>
  )
}

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Bold, Italic, Heading2, Heading3, Pilcrow, List, ListOrdered, Quote, Link2, ImagePlus, RemoveFormatting } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { resizeImage } from '@/lib/image'
import { cn } from '@/lib/utils'

const ALLOWED = new Set(['H2', 'H3', 'P', 'BR', 'STRONG', 'EM', 'U', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'A', 'IMG'])
const RENAME: Record<string, string> = { H1: 'H2', H4: 'H3', H5: 'H3', H6: 'H3', B: 'STRONG', I: 'EM', DIV: 'P' }
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'META', 'LINK', 'HEAD', 'TITLE'])

/** Keeps only simple blog formatting (headings, bold, lists, links, images). Used on pasted content, so Word / Google Docs styling never leaks in. */
export function cleanHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const walk = (node: Node): Node[] => {
    if (node.nodeType === Node.TEXT_NODE) return [node.cloneNode()]
    if (node.nodeType !== Node.ELEMENT_NODE) return []
    const el = node as HTMLElement
    if (DROP.has(el.tagName)) return []
    const kids = Array.from(el.childNodes).flatMap(walk)
    // Word / Docs wrap bold text in styled spans, so keep the bold.
    const style = el.getAttribute('style') ?? ''
    let tag = RENAME[el.tagName] ?? el.tagName
    if (el.tagName === 'SPAN' && /font-weight:\s*(bold|[6-9]00)/i.test(style)) tag = 'STRONG'
    if (el.tagName === 'SPAN' && /font-style:\s*italic/i.test(style)) tag = 'EM'
    if (!ALLOWED.has(tag)) return kids
    if (tag === 'IMG' && !/^https?:/i.test(el.getAttribute('src') ?? '')) return [] // local / base64 pasted images can't be saved
    const out = document.createElement(tag.toLowerCase())
    if (tag === 'A') {
      const href = el.getAttribute('href') ?? ''
      if (!/^(https?:|mailto:|tel:|\/)/i.test(href)) return kids
      out.setAttribute('href', href)
      out.setAttribute('target', '_blank')
      out.setAttribute('rel', 'noopener noreferrer')
    }
    if (tag === 'IMG') {
      out.setAttribute('src', el.getAttribute('src') ?? '')
      out.setAttribute('alt', el.getAttribute('alt') ?? '')
    }
    kids.forEach((k) => out.appendChild(k))
    return [out]
  }
  const wrap = document.createElement('div')
  Array.from(doc.body.childNodes).flatMap(walk).forEach((n) => wrap.appendChild(n))
  return wrap.innerHTML
}

function ToolButton({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()} // keep the text selection while clicking the toolbar
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-brand-600"
    >
      {children}
    </button>
  )
}

export function RichTextEditor({ value, onChange, className }: { value: string; onChange: (html: string) => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // Load the initial content once (the editor owns the content after that).
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emit = () => onChange(ref.current?.innerHTML ?? '')
  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus()
    document.execCommand(cmd, false, arg)
    emit()
  }

  const addLink = () => {
    const url = window.prompt('Paste the link (https://...)')
    if (url) exec('createLink', url.trim())
  }

  const insertImage = async (file: File) => {
    setUploading(true)
    try {
      const big = await resizeImage(file, 1600, 0.85)
      const path = `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`
      const { error } = await supabase.storage.from('blog').upload(path, big, { contentType: 'image/jpeg', cacheControl: '31536000' })
      if (error) throw error
      const { data } = supabase.storage.from('blog').getPublicUrl(path)
      exec('insertHTML', `<img src="${data.publicUrl}" alt="" />`)
    } catch (err) {
      toast.error(`Image upload failed: ${err instanceof Error ? err.message : 'try again'}`)
    }
    setUploading(false)
  }

  const onPaste = (e: React.ClipboardEvent) => {
    const imageFile = Array.from(e.clipboardData.files).find((f) => f.type.startsWith('image/'))
    if (imageFile && !e.clipboardData.getData('text/html')) {
      e.preventDefault()
      void insertImage(imageFile)
      return
    }
    const html = e.clipboardData.getData('text/html')
    if (html) {
      e.preventDefault()
      document.execCommand('insertHTML', false, cleanHtml(html))
      emit()
    }
  }

  return (
    <div className={cn('rounded-xl border border-blush-200 bg-white', className)}>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-xl border-b border-blush-100 bg-gray-50 px-2 py-1.5">
        <ToolButton title="Heading" onClick={() => exec('formatBlock', 'H2')}><Heading2 size={16} /></ToolButton>
        <ToolButton title="Sub-heading" onClick={() => exec('formatBlock', 'H3')}><Heading3 size={16} /></ToolButton>
        <ToolButton title="Normal paragraph" onClick={() => exec('formatBlock', 'P')}><Pilcrow size={16} /></ToolButton>
        <span className="mx-1 h-5 w-px bg-gray-200" />
        <ToolButton title="Bold" onClick={() => exec('bold')}><Bold size={16} /></ToolButton>
        <ToolButton title="Italic" onClick={() => exec('italic')}><Italic size={16} /></ToolButton>
        <ToolButton title="Bullet list" onClick={() => exec('insertUnorderedList')}><List size={16} /></ToolButton>
        <ToolButton title="Numbered list" onClick={() => exec('insertOrderedList')}><ListOrdered size={16} /></ToolButton>
        <ToolButton title="Quote" onClick={() => exec('formatBlock', 'BLOCKQUOTE')}><Quote size={16} /></ToolButton>
        <ToolButton title="Add link" onClick={addLink}><Link2 size={16} /></ToolButton>
        <ToolButton title="Insert image" onClick={() => fileRef.current?.click()}><ImagePlus size={16} /></ToolButton>
        <ToolButton title="Clear formatting" onClick={() => exec('removeFormat')}><RemoveFormatting size={16} /></ToolButton>
        {uploading && <span className="ml-2 text-xs text-gray-500">Uploading image…</span>}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void insertImage(f)
            e.target.value = ''
          }}
        />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        onInput={emit}
        onBlur={emit}
        onPaste={onPaste}
        data-placeholder="Write or paste your blog here. Use the buttons above for headings, bold, lists and pictures."
        className="blog-content min-h-[280px] max-h-[55vh] overflow-y-auto rounded-b-xl px-4 py-3 text-ink-900 focus:outline-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  )
}

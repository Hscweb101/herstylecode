import { Link } from 'react-router-dom'
import { useSeo } from '@/hooks/useSeo'
import { CARE_INTRO, CARE_INTRO_TITLE, CARE_STEPS } from '@/lib/careGuide'

export default function CareInstructions() {
  useSeo({
    title: 'Jewellery Care Instructions',
    description: 'How to care for your HerStyleCode jewellery: keep it dry, avoid perfumes and chemicals, store it carefully and clean it gently.',
    path: '/care-instructions',
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-16">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">Care Instructions</p>
        <h1 className="mt-3 font-serif text-3xl text-ink-900 md:text-5xl">{CARE_INTRO_TITLE}</h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink-500">{CARE_INTRO}</p>
        <span className="mx-auto mt-6 block h-px w-24 bg-brand-300" />
      </div>

      <ol className="mt-12 grid gap-5 sm:grid-cols-2">
        {CARE_STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="relative rounded-2xl border border-blush-200 bg-white p-6 shadow-luxe-sm">
            <span className="absolute right-5 top-4 font-serif text-4xl text-blush-200" aria-hidden>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white">
              <Icon size={22} />
            </span>
            <h2 className="mt-4 font-serif text-xl text-ink-900">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">{text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-12 rounded-2xl bg-brand-600 px-6 py-8 text-center text-white">
        <p className="font-serif text-xl">A little care goes a long way.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/85">Have a question about a piece you own? We are happy to help.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/contact" className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-blush-100">
            Contact Us
          </Link>
          <Link to="/shop" className="rounded-full border border-white/60 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { Heart, Clock, Award, Gift, Sparkles } from 'lucide-react'
import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils'
import { useSeo } from '@/hooks/useSeo'
import { BrandStoryText, Emphasis, Lines, Para, ScriptLine } from '@/components/storefront/BrandCopy'
import heroImg from '@/assets/about/aboutbg.webp'
import storyImg from '@/assets/about/aboutimg1.webp'
import beliefImg from '@/assets/about/aboutimg2.webp'
import philosophyImg from '@/assets/about/aboutimg3.webp'
import brandImg from '@/assets/about/aboutimg4.webp'

function Reveal({ children, className, threshold = 0.15 }: { children: React.ReactNode; className?: string; threshold?: number }) {
  const { ref, visible } = useInView<HTMLDivElement>(threshold)
  return (
    <div
      ref={ref}
      className={cn('transition-all duration-1000 ease-out', visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0', className)}
    >
      {children}
    </div>
  )
}

function Eyebrow({ children, tone = 'brand' }: { children: React.ReactNode; tone?: 'brand' | 'light' }) {
  return (
    <p
      className={cn(
        'mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]',
        tone === 'brand' ? 'text-brand-500' : 'text-blush-100',
      )}
    >
      <span className={cn('h-px w-8', tone === 'brand' ? 'bg-brand-400' : 'bg-blush-100')} />
      {children}
    </p>
  )
}

function ReadMoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand-600 transition-colors hover:text-brand-700"
    >
      {children} <span aria-hidden>&rarr;</span>
    </a>
  )
}

const philosophyItems = [
  { icon: Clock, label: 'Timeless Designs' },
  { icon: Award, label: 'Premium Quality' },
  { icon: Gift, label: 'Curated Collections' },
  { icon: Sparkles, label: 'Affordable Luxury' },
]

export default function AboutUs() {
  useSeo({
    title: 'About HerStyleCode (Her Style Code) - Our Story & Jewellery Philosophy',
    description: 'HerStyleCode is a modern Indian fashion jewellery brand - "Your Style. Your Rules." Learn our story and why we design jewellery for every mood and moment.',
    path: '/page/about-us',
  })
  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="relative flex min-h-[480px] items-center overflow-hidden md:min-h-[620px]">
        <img src={heroImg} alt="Her Style Code jewellery" className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900/95 via-ink-900/60 to-ink-900/10" />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
          <Reveal className="max-w-lg">
            <Eyebrow tone="light">About Us</Eyebrow>
            <h1 className="text-4xl leading-tight text-white md:text-6xl">More Than Just Jewellery</h1>
            <p className="mt-5 text-sm leading-relaxed text-white/80 md:text-base">
              At Her Style Code, we believe every woman has a unique style, a different story and a code of her own.
              We&apos;re here to help you find pieces that make you feel beautiful, confident and completely you.
            </p>
            <p className="font-script mt-6 text-xl text-blush-100 md:text-2xl">Her Style. Her Rules. Her Code.</p>
          </Reveal>
        </div>

        <p className="font-script absolute right-6 top-10 max-w-[11rem] rotate-2 text-right text-lg leading-snug text-white/90 md:right-14 md:top-16 md:max-w-[13rem] md:text-2xl">
          Because you deserve to feel beautiful — always
          <Heart size={14} className="ml-auto mt-2 fill-white/80 text-white/80" />
        </p>
      </section>

      {/* Why Her Style Code - the full story */}
      <section id="our-story" className="scroll-mt-24 bg-cream py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 md:grid-cols-[1.2fr_1fr] md:gap-14 md:px-8">
          <Reveal className="order-2 md:sticky md:top-28 md:order-1">
            <img src={storyImg} alt="The little girl who dreamed" className="mx-auto w-full max-w-2xl" />
          </Reveal>
          <Reveal threshold={0.02} className="order-1 md:order-2">
            <Eyebrow>Why &ldquo;Her Style Code&rdquo;?</Eyebrow>
            <h2 className="text-2xl leading-tight text-ink-900 md:text-4xl">The Story Behind Her Style Code</h2>
            <BrandStoryText />
            <ReadMoreLink href="#our-belief">About Us</ReadMoreLink>
          </Reveal>
        </div>
      </section>

      {/* Our About Us */}
      <section id="our-belief" className="scroll-mt-24 bg-white py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:gap-16 md:px-8">
          <Reveal>
            <Eyebrow>About Us</Eyebrow>
            <h2 className="text-2xl leading-tight text-ink-900 md:text-4xl">Her Style Code &mdash; Born From A Belief</h2>
            <p className="mt-5 text-[17px] font-medium leading-relaxed text-ink-700">
              We believe every woman has a style that is uniquely her own.
            </p>
            <Lines
              lines={[
                'Not something dictated by trends.',
                'Not something chosen to impress others.',
                'But something that makes her look in the mirror and think,',
              ]}
            />
            <Emphasis>&ldquo;This feels like me.&rdquo;</Emphasis>
            <Para>
              Her Style Code was born from this very feeling &mdash; the belief that style is more than what you wear. It is how
              you express yourself, how you carry yourself, and how you feel in your own skin.
            </Para>
            <Para>We created Her Style Code for the woman who loves beautiful things, but chooses them for herself.</Para>
            <Para>
              From effortless everyday jewellery to pieces that make a moment feel a little more special, and from timeless
              clothing to styles that let her personality shine &mdash; everything we bring together is chosen with one thought:
            </Para>
            <ScriptLine>It should feel like you.</ScriptLine>
            <ReadMoreLink href="#philosophy">Our Philosophy</ReadMoreLink>
          </Reveal>
          <Reveal className="delay-150">
            <div className="relative mx-auto aspect-[6/5] w-full max-w-lg overflow-hidden rounded-[1.5rem] shadow-luxe">
              <img src={beliefImg} alt="It should feel like you" className="h-full w-full object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Our Philosophy */}
      <section id="philosophy" className="scroll-mt-24 bg-blush-50/70 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_1fr_auto] md:gap-10">
            <Reveal>
              <div className="mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[1.5rem] shadow-luxe-sm">
                <img src={philosophyImg} alt="Luxury doesn't always have to be loud" className="h-full w-full object-cover" />
              </div>
            </Reveal>
            <Reveal className="delay-100">
              <Eyebrow>Our Philosophy</Eyebrow>
              <h2 className="text-2xl leading-tight text-ink-900 md:text-4xl">Luxury Doesn&rsquo;t Always Have to Be Loud.</h2>
              <p className="mt-5 text-[17px] font-medium leading-relaxed text-ink-700">Sometimes, luxury is in the little things.</p>
              <Lines
                lines={[
                  'A delicate necklace that becomes part of your everyday.',
                  'A pair of earrings that instantly changes your mood.',
                  'An outfit that makes you feel confident before you even step outside.',
                ]}
              />
              <Para>
                At Her Style Code, we believe in accessible luxury &mdash; beautiful, elevated pieces that allow you to experience
                that feeling without waiting for a special occasion.
              </Para>
              <Emphasis>Because why save beautiful things for someday?</Emphasis>
              <Lines className="font-medium text-ink-700" lines={['Wear them.', 'Live in them.', 'Make them yours.']} />
            </Reveal>
            <Reveal className="delay-200 flex flex-row gap-6 md:w-44 md:flex-col md:gap-7">
              {philosophyItems.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2 text-center md:flex-row md:text-left">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-brand-200 text-brand-500">
                    <item.icon size={18} />
                  </span>
                  <span className="text-xs font-medium leading-snug text-ink-700">{item.label}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* Behind the Brand */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:gap-16 md:px-8">
          <Reveal>
            <Eyebrow>Behind The Brand</Eyebrow>
            <h2 className="text-2xl leading-tight text-ink-900 md:text-4xl">A Dream, A Vision, Her Style Code.</h2>
            <Para className="mt-5">
              Behind Her Style Code is a simple dream &mdash; to create a space where women can discover pieces that make them
              feel beautiful, confident and completely themselves.
            </Para>
            <Para>Every collection, every detail and every piece we bring to you is selected with intention.</Para>
            <Para>
              We look for styles that don&rsquo;t simply follow what&rsquo;s trending today, but have the power to become a part
              of your story tomorrow.
            </Para>
            <Para>Because the pieces we wear often become more than just things we own.</Para>
            <ScriptLine className="mt-3">They become memories.</ScriptLine>
            <Lines
              className="mt-5"
              lines={[
                'The earrings you wore on your first date.',
                'The necklace you never take off.',
                'The outfit that made you feel unstoppable.',
                'The little piece you bought just because you deserved something beautiful.',
              ]}
            />
            <Emphasis>That&rsquo;s the kind of connection we want Her Style Code to create.</Emphasis>
          </Reveal>
          <Reveal className="delay-150">
            <div className="relative mx-auto aspect-[6/5] w-full max-w-lg overflow-hidden rounded-[1.5rem] shadow-luxe">
              <img src={brandImg} alt="Not just jewellery, memories" className="h-full w-full object-cover" />
              <p className="font-script absolute bottom-6 right-6 max-w-[9rem] rotate-[-2deg] text-right text-lg leading-snug text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
                Not just jewellery memories
                <Heart size={13} className="ml-auto mt-1 fill-white/90 text-white/90" />
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center md:py-20">
        <Reveal>
          <p className="font-script text-2xl text-brand-600 md:text-3xl">Her Style. Her Rules. Her Code.</p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink-900 px-8 py-3.5 text-sm font-medium tracking-wide text-white shadow-luxe transition-transform hover:scale-105"
          >
            Shop The Collection
          </Link>
        </Reveal>
      </section>
    </div>
  )
}

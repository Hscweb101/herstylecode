import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/* Typography helpers shared by the Home and About pages so the brand copy looks the same everywhere. */

export function Para({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('mt-4 text-[15px] leading-[1.85] text-ink-500', className)}>{children}</p>
}

/** A stack of short lines, e.g. "Her own clothes. / Her own colours." Each line breaks on its own. */
export function Lines({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <div className={cn('mt-4 space-y-1 text-[15px] leading-[1.8] text-ink-500', className)}>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  )
}

/** A line that carries the emotional weight of a paragraph. */
export function Emphasis({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 border-l-2 border-brand-300 pl-4 font-serif text-lg leading-snug text-ink-900 md:text-xl">{children}</p>
}

export function ScriptLine({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('font-script mt-5 text-2xl text-brand-600 md:text-3xl', className)}>{children}</p>
}

/** The full "Story Behind Her Style Code". */
export function BrandStoryText() {
  return (
    <div>
      <p className="mt-5 text-[17px] font-medium leading-relaxed text-ink-700">
        Before she knew what fashion was, she was already playing with it.
      </p>

      <Para>
        She was a little girl, standing in front of her mother’s mirror, secretly opening that jewellery box she had been
        told not to touch.
      </Para>
      <Para>
        She would pick up her mother’s earrings, put on a bindi that was probably too big for her little forehead, wrap a
        dupatta around herself, and stand in front of the mirror.
      </Para>
      <Para>And for those few minutes, she wasn’t just a little girl anymore.</Para>
      <Emphasis>She was her.</Emphasis>
      <Para>Beautiful. Confident. Curious. A little dramatic. And completely herself.</Para>
      <Lines lines={['She didn’t need anyone to tell her how to style it.', 'She simply felt it.']} />

      <Para className="mt-8 font-medium text-ink-700">Then she grew up.</Para>
      <Para>
        At 12 or 13, the jewellery box became her own little world. She started choosing her bangles, matching earrings with
        her suits, experimenting with colours, trying different hairstyles and wondering, “Does this look good on me?”
      </Para>
      <Para>Her style started changing as she did.</Para>
      <Para>College came. First jobs came. First paycheque came.</Para>
      <Para>And suddenly, buying that one pair of earrings wasn’t just shopping anymore.</Para>
      <Emphasis>It was a little celebration of becoming independent.</Emphasis>

      <Para className="mt-8">Then came the big moments — weddings, festivals, celebrations, new beginnings.</Para>
      <Para>
        She started collecting pieces she loved. Some were simple. Some were bold. Some reminded her of someone special. Some
        simply made her look in the mirror one more time and smile.
      </Para>
      <Para>Because somewhere along the way, she had realised something:</Para>
      <Emphasis>
        Style was never really about following someone else.
        <br />
        It was about discovering herself.
      </Emphasis>

      <Para className="mt-8 font-medium text-ink-700">And that’s where Her Style Code was born.</Para>
      <Para>Because every woman has her own code.</Para>
      <Lines
        lines={[
          'A way she chooses to dress.',
          'A way she chooses to express herself.',
          'A way she walks into a room.',
          'A way she says this is me — without saying a word.',
        ]}
      />

      <Para className="mt-8">Our inspiration is that little girl in front of the mirror.</Para>
      <Para>The girl who borrowed her mother’s jewellery and imagined a thousand different versions of herself.</Para>
      <Para>She is still there.</Para>
      <Lines lines={['Only now, she gets to choose her own jewellery.', 'Her own clothes.', 'Her own colours.', 'Her own rules.']} />

      <Para className="mt-8 font-medium text-ink-700">Her Style Code is for every version of her.</Para>
      <Lines
        lines={[
          'The little girl who loved dressing up.',
          'The teenager discovering her style.',
          'The woman finding her confidence.',
          'The bride creating memories.',
          'The mother who still loves looking beautiful.',
          'And every woman in between.',
        ]}
      />

      <Lines
        className="mt-8"
        lines={[
          'Because there is no single way to be a woman.',
          'There is no single way to be beautiful.',
          'And there is certainly no single way to have style.',
        ]}
      />
      <Emphasis>There’s only her way.</Emphasis>

      <ScriptLine className="mt-8">Her Style. Her Rules. Her Code.</ScriptLine>
      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-ink-900">Welcome to Her Style Code.</p>
    </div>
  )
}

/**
 * The story with a "Read the full story" toggle. The complete text is always on the page;
 * collapsed it shows the opening with a soft fade so the home page doesn't become a wall of text.
 */
export function CollapsibleBrandStory() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div className={cn('relative overflow-hidden transition-[max-height] duration-700 ease-in-out', open ? 'max-h-[7000px]' : 'max-h-[19rem]')}>
        <BrandStoryText />
        {!open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-cream to-transparent" />}
      </div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand-600 transition-colors hover:text-brand-700"
      >
        {open ? 'Show less' : 'Read the full story'}
        <ChevronDown size={14} className={cn('transition-transform duration-300', open && 'rotate-180')} />
      </button>
    </div>
  )
}

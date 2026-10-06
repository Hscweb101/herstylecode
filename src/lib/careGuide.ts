import { Droplets, Hand, Package, SprayCan, Sparkles, Sun, type LucideIcon } from 'lucide-react'

export const CARE_INTRO_TITLE = 'Your jewellery deserves a little love.'
export const CARE_INTRO = 'With the right care, you can keep your favourite pieces looking beautiful for longer.'

export interface CareStep {
  icon: LucideIcon
  title: string
  /** One-liner shown on the product page. */
  short: string
  /** Full guidance shown on the Care Instructions page. */
  text: string
}

export const CARE_STEPS: CareStep[] = [
  {
    icon: Droplets,
    title: 'Keep It Dry',
    short: 'Remove before showering, swimming, exercising or sleeping.',
    text: 'Remove your jewellery before showering, swimming, exercising or sleeping. Avoid prolonged contact with water and moisture.',
  },
  {
    icon: SprayCan,
    title: 'Avoid Perfumes & Chemicals',
    short: 'Apply perfume, lotion and makeup before wearing.',
    text: 'Apply perfume, lotion, hairspray and makeup before putting on your jewellery. Chemicals and cosmetics can affect the finish and shine.',
  },
  {
    icon: Package,
    title: 'Store It Carefully',
    short: 'Keep each piece in a clean, dry pouch or box.',
    text: 'Keep each piece in a clean, dry pouch or jewellery box. Storing pieces separately helps prevent scratches, tangling and unnecessary contact with moisture.',
  },
  {
    icon: Hand,
    title: 'Handle With Care',
    short: 'Avoid pulling or bending delicate chains and earrings.',
    text: 'Avoid pulling, bending or applying excessive pressure, especially with delicate chains, earrings and statement pieces.',
  },
  {
    icon: Sun,
    title: 'Keep Away From Heat & Sunlight',
    short: 'Avoid direct sun, heat and humid places like bathrooms.',
    text: 'Store your jewellery away from direct sunlight, excessive heat and humid areas such as bathrooms.',
  },
  {
    icon: Sparkles,
    title: 'Clean Gently',
    short: 'Wipe with a soft, dry, lint-free cloth.',
    text: 'If needed, gently wipe your jewellery with a soft, dry, lint-free cloth. Avoid abrasive cleaners, polishing chemicals or rough fabrics.',
  },
]

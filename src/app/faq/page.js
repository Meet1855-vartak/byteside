'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      q: "Why make this? There's already WhatsApp, Instagram, etc.",
      a: "Byteside isn't trying to replace them. WhatsApp and Instagram are built around feeds, algorithms, and engagement. Byteside is the opposite — a small, quiet space that's actually yours. No algorithm deciding what you see, no ads, no strangers. Just you and people you know, writing whatever's on your mind.",
    },
    {
      q: "What's actually unique about it?",
      a: "A few things: it's genuinely owned and run by someone you know, not a company's terms of service. The P2P board lets you post \"does anyone have X\" once and have anyone in the group respond, instead of DMing people one at a time hoping they have it. There's no algorithm, no ads, no infinite scroll designed to hook you. And it's small on purpose — built for a real circle of people, not to scale to millions.",
    },
    {
      q: "Can't I just send a Wormhole/Drive link over Insta or WhatsApp DM?",
      a: "Technically, yes. But that requires already knowing who to ask. On Byteside, you post the request once and anyone can see and respond — including people you wouldn't have thought to ask. If you already know exactly who has the file, DMing them directly is faster. The board helps when you don't know who does.",
    },
    {
      q: "How does this hold up against apps built by huge companies?",
      a: "Honestly, it doesn't compete on scale or engineering — WhatsApp and Instagram have massive teams and years of infrastructure behind them. Byteside is a small personal project. What it offers instead isn't technical superiority, it's that there's no algorithm, no ads, and no business model trying to maximize your screen time — because there isn't one at all.",
    },
    {
      q: "What happens if you get bored and shut it down?",
      a: "That's a real possibility — this is a personal project, not a company with obligations. But there's nothing here you can't get elsewhere, so if it ever shuts down, you lose a nice-to-have space, not something critical.",
    },
    {
      q: "Why should I trust you with my data?",
      a: "Your email is stored securely and is only ever visible to you and the admin — never sold, never shared, never used for ad targeting, because there's no business model here that would benefit from doing that.",
    },
    {
      q: "Isn't this just a hobby project?",
      a: "Yes — and that's the point. It's not trying to be a product. It's a space built for people I actually know.",
    },
    {
      q: "What if someone posts something bad or abuses it?",
      a: "The admin can see all activity across the site, and can remove any post or content and ban users if needed — real oversight, done by a person you know rather than an automated system.",
    },
    {
      q: "Is my data private from other users, not just from you?",
      a: "Posts and P2P requests are visible to anyone with access to the site — that's the point, it's a shared space. Your email, however, is private and only ever visible to you and the admin, never to other regular users.",
    },
  ]

  return (
    <main className="bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-serif text-3xl mb-1">Frequently Asked Questions</h1>
          <p className="text-sm text-muted">Honest answers, no marketing spin.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <span className="font-medium text-sm sm:text-base">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-muted transition-transform duration-200 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 text-sm text-muted leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
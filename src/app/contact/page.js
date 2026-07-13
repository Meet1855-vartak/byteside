import { Mail, MessageCircle, ArrowRight } from 'lucide-react'
import { SiInstagram } from '@icons-pack/react-simple-icons'

export default function Contact() {
  const contacts = [
    {
      icon: Mail,
      label: 'Email',
      href: 'mailto:meetvartak@proton.me',
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      href: 'https://wa.me/917666769429',
    },
    {
      icon: SiInstagram,
      label: 'Instagram',
      href: 'https://www.instagram.com/meet5_049?igsh=MzlxOTJkamh3d2oz',
    },
  ]

  return (
    <main className="bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-serif text-3xl mb-1">Get in touch</h1>
          <p className="text-sm text-muted">Reach out however&apos;s easiest for you.</p>
        </div>

        <div className="space-y-4">
          {contacts.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-surface border border-border rounded-xl p-5 hover:border-accent transition-colors group"
            >
              <div className="shrink-0 w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <Icon size={20} className="text-accent" />
              </div>
              <p className="text-base font-medium flex-1">{label}</p>
              <ArrowRight size={16} className="text-muted group-hover:text-accent transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
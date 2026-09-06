import { useState } from 'react'

interface Props { page: 'home' | 'contact' | 'services'; onNavigate: (page: string) => void }

const content = {
  home: {
    eyebrow: 'A clearer path to public support',
    title: 'One calm place to understand what is available to you.',
    body: 'SchemeX turns complicated government scheme information into practical matches, explanations, calculators, and next steps for entrepreneurs and small businesses.',
    action: 'Find my schemes',
  },
  services: {
    eyebrow: 'What SchemeX does',
    title: 'From eligibility rules to an action plan.',
    body: 'Search verified schemes, save your profile, see why a scheme matches, estimate benefits, and understand which missing document or registration should come next.',
    action: 'Explore schemes',
  },
  contact: {
    eyebrow: 'Talk to the team',
    title: 'Questions, feedback, or a scheme we should verify?',
    body: 'Send us a note and help us make public support easier to understand. We review feedback from entrepreneurs, advisors, and community organisations.',
    action: 'Send a message',
  },
}

export default function PublicPage({ page, onNavigate }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const item = content[page]
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF7F0', color: '#2D2A26', fontFamily: 'Inter, sans-serif' }}>
      <header className="border-b" style={{ borderColor: '#E5E0D8', background: '#fff' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => onNavigate('landing')} style={{ fontFamily: 'Fraunces, serif', color: '#1E3A5F', fontSize: '1.3rem', fontWeight: 600 }}>Scheme<span style={{ color: '#E8A33D' }}>X</span></button>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <button onClick={() => onNavigate('home')} style={{ color: page === 'home' ? '#1E3A5F' : '#7A8B99' }}>Home</button>
            <button onClick={() => onNavigate('services')} style={{ color: page === 'services' ? '#1E3A5F' : '#7A8B99' }}>Services</button>
            <button onClick={() => onNavigate('contact')} style={{ color: page === 'contact' ? '#1E3A5F' : '#7A8B99' }}>Contact</button>
            <button onClick={() => onNavigate('login')} className="font-semibold" style={{ color: '#1E3A5F' }}>Log in</button>
          </nav>
          <button type="button" onClick={() => setMenuOpen(open => !open)} className="md:hidden w-10 h-10 rounded-lg text-lg" style={{ color: '#1E3A5F', border: '1px solid #E5E0D8' }} aria-expanded={menuOpen} aria-label="Toggle navigation menu">{menuOpen ? '×' : '☰'}</button>
        </div>
        {menuOpen && <div className="md:hidden px-4 pb-4 space-y-1" style={{ background: '#fff' }}>
          {['home', 'services', 'contact'].map(item => <button key={item} onClick={() => { setMenuOpen(false); onNavigate(item); }} className="block w-full rounded-lg px-3 py-3 text-left text-sm font-medium capitalize" style={{ color: '#1E3A5F' }}>{item}</button>)}
          <button onClick={() => { setMenuOpen(false); onNavigate('login'); }} className="block w-full rounded-lg px-3 py-3 text-left text-sm font-semibold" style={{ color: '#1E3A5F' }}>Log in</button>
        </div>}
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#C7511F' }}>{item.eyebrow}</p>
          <h1 className="mt-4" style={{ fontFamily: 'Fraunces, serif', color: '#1E3A5F', fontSize: 'clamp(2.3rem, 6vw, 4.5rem)', lineHeight: 1.05, fontWeight: 500 }}>{item.title}</h1>
          <p className="mt-6 text-lg leading-relaxed max-w-2xl" style={{ color: '#7A8B99' }}>{item.body}</p>
          <button onClick={() => onNavigate(page === 'contact' ? 'login' : page === 'home' ? 'onboarding' : 'schemes')} className="mt-8 rounded-lg px-6 py-3 font-semibold" style={{ background: '#1E3A5F', color: '#FAF7F0' }}>{item.action} →</button>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-20">
          {['Verified information', 'Personalised matching', 'Clear next steps'].map((label, index) => <div key={label} className="p-6 rounded-xl" style={{ background: '#fff', border: '1px solid #E5E0D8' }}><span className="text-sm font-semibold" style={{ color: '#E8A33D' }}>0{index + 1}</span><h2 className="mt-3 font-semibold" style={{ color: '#1E3A5F' }}>{label}</h2><p className="mt-2 text-sm" style={{ color: '#7A8B99' }}>Designed to help you make one informed decision at a time.</p></div>)}
        </div>
      </main>
      <footer className="border-t" style={{ borderColor: '#E5E0D8', background: '#fff' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between gap-4 text-sm" style={{ color: '#7A8B99' }}><span style={{ fontFamily: 'Fraunces, serif', color: '#1E3A5F', fontWeight: 600 }}>Scheme<span style={{ color: '#E8A33D' }}>X</span></span><span>Guidance for your next step. Final decisions remain with the relevant authority.</span></div>
      </footer>
    </div>
  )
}

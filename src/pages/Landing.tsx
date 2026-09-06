import { SCHEMES } from '../data/schemes';
import { useState } from 'react';

interface Props {
  onNavigate: (page: string) => void;
}

const JOURNEY_STEPS = [
  { step: '01', label: 'Your Profile', desc: 'Tell us about yourself and your business' },
  { step: '02', label: 'Eligibility Check', desc: 'We match you against every published scheme rule' },
  { step: '03', label: 'Matched Schemes', desc: 'See every scheme you qualify for' },
  { step: '04', label: 'Benefit Calculator', desc: 'Estimate exactly how much you could receive' },
  { step: '05', label: 'Near-Miss Guidance', desc: 'Understand what\'s holding you back' },
  { step: '06', label: 'Your Next Steps', desc: 'A clear, actionable plan — no confusion' },
];

export default function Landing({ onNavigate }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const schemeCount = SCHEMES.length;
  const calculatorCount = SCHEMES.filter(scheme => scheme.calculator?.enabled).length;
  const verifiedCount = SCHEMES.filter(scheme => scheme.lastVerified).length;
  const stats = [
    { value: schemeCount.toString(), label: 'Published schemes', sub: `${verifiedCount} with verification dates` },
    { value: calculatorCount.toString(), label: 'Finance calculators', sub: 'For eligible profiles' },
    { value: verifiedCount.toString(), label: 'Verified records', sub: 'Loaded from the catalog' },
  ];
  const featuredScheme = SCHEMES[0];
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F0', color: '#2D2A26', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #E5E0D8' }} className="sticky top-0 z-50" role="navigation" aria-label="Main navigation">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between" style={{ backgroundColor: '#FAF7F0' }}>
          <span style={{ fontFamily: 'Fraunces, serif', color: '#1E3A5F', fontSize: '1.35rem', fontWeight: 600 }}>
            Scheme<span style={{ color: '#E8A33D' }}>X</span>
          </span>
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => onNavigate('home')} className="hidden md:block text-sm font-medium" style={{ color: '#7A8B99' }}>Home</button>
            <button onClick={() => onNavigate('services')} className="hidden md:block text-sm font-medium" style={{ color: '#7A8B99' }}>Services</button>
            <button onClick={() => onNavigate('contact')} className="hidden md:block text-sm font-medium" style={{ color: '#7A8B99' }}>Contact</button>
            <button
              onClick={() => onNavigate('login')}
              className="text-sm font-medium transition-colors"
              style={{ color: '#7A8B99' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1E3A5F')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7A8B99')}
            >
              Explore Schemes
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 text-sm font-semibold rounded-md transition-all"
              style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#15304f')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1E3A5F')}
            >
              Get started
            </button>
          </div>
          <div className="flex items-center gap-2 md:hidden"><button onClick={() => onNavigate('login')} className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}>Get started</button><button type="button" onClick={() => setMenuOpen(open => !open)} className="w-10 h-10 rounded-lg text-lg" style={{ color: '#1E3A5F', border: '1px solid #E5E0D8' }} aria-expanded={menuOpen} aria-label="Toggle navigation menu">{menuOpen ? '×' : '☰'}</button></div>
        </div>
        {menuOpen && <div className="md:hidden px-4 pb-4 space-y-1" style={{ backgroundColor: '#FAF7F0' }}>
          {['home', 'services', 'contact'].map(item => <button key={item} onClick={() => { setMenuOpen(false); onNavigate(item); }} className="block w-full rounded-lg px-3 py-3 text-left text-sm font-medium capitalize" style={{ color: '#1E3A5F' }}>{item}</button>)}
          <button onClick={() => { setMenuOpen(false); onNavigate('login'); }} className="block w-full rounded-lg px-3 py-3 text-left text-sm font-medium" style={{ color: '#1E3A5F' }}>Explore Schemes</button>
          <button onClick={() => { setMenuOpen(false); onNavigate('login'); }} className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold" style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}>Get started</button>
        </div>}
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ backgroundColor: '#E8A33D22', color: '#C7511F', border: '1px solid #E8A33D55' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#E8A33D' }} aria-hidden="true" />
            Trusted civic-tech platform for Indian entrepreneurs
          </div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', lineHeight: 1.1, color: '#1E3A5F', fontWeight: 500, marginBottom: '1.25rem' }}>
            Find the Right Scheme.<br />
            <em style={{ fontStyle: 'italic', color: '#E8A33D' }}>Know What to Do Next.</em>
          </h1>
          <p className="text-lg leading-relaxed mb-8" style={{ color: '#7A8B99', maxWidth: '36rem' }}>
            Discover government schemes matched to your profile, understand why you qualify,
            estimate your potential benefits, and get your exact next step — clearly.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('login')}
              className="px-6 py-3 text-base font-semibold rounded-md transition-all"
              style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#15304f')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1E3A5F')}
            >
              Find My Schemes →
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="px-6 py-3 text-base font-semibold rounded-md transition-all"
              style={{ backgroundColor: 'transparent', color: '#1E3A5F', border: '1.5px solid #1E3A5F' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1E3A5F11' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              Explore Schemes
            </button>
          </div>
          <p className="mt-4 text-sm" style={{ color: '#7A8B99' }}>
            Free to explore · Save your profile securely when you create an account
          </p>
        </div>
      </section>

      <section aria-labelledby="verified-heading" className="max-w-6xl mx-auto w-full px-6 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
          <div><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#C7511F' }}>Live catalog</p><h2 id="verified-heading" className="mt-2" style={{ fontFamily: 'Fraunces, serif', fontSize: '1.85rem', color: '#1E3A5F', fontWeight: 500 }}>Verified schemes</h2><p className="mt-2 text-sm" style={{ color: '#7A8B99' }}>Published records currently available for matching and calculation.</p></div>
          <button onClick={() => onNavigate('login')} className="text-sm font-semibold" style={{ color: '#1E3A5F' }}>See all after login →</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCHEMES.slice(0, 3).map(scheme => <article key={scheme.id} className="rounded-xl p-5" style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8' }}><p className="text-xs font-semibold" style={{ color: '#E8A33D' }}>{scheme.category.replace('_', ' ')}</p><h3 className="mt-2 font-semibold" style={{ color: '#1E3A5F' }}>{scheme.name}</h3><p className="mt-2 text-sm line-clamp-3" style={{ color: '#7A8B99' }}>{scheme.description}</p><p className="mt-4 text-xs" style={{ color: '#7A8B99' }}>Verified {scheme.lastVerified}</p></article>)}
          {!SCHEMES.length && <div className="md:col-span-3 rounded-xl p-6 text-sm" style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8', color: '#7A8B99' }}>Verified scheme records will appear here when the catalog is loaded.</div>}
        </div>
      </section>

      {/* Stats bar */}
      <section aria-label="Platform statistics" style={{ borderTop: '1px solid #E5E0D8', borderBottom: '1px solid #E5E0D8', backgroundColor: '#fff' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:divide-x" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
          {stats.map(s => (
            <div key={s.label} className="sm:px-8 first:pl-0 last:pr-0 text-center sm:text-left">
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 600, color: '#1E3A5F' }}>{s.value}</div>
              <div className="font-semibold text-sm" style={{ color: '#2D2A26' }}>{s.label}</div>
              <div className="text-xs mt-0.5" style={{ color: '#7A8B99' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Journey steps */}
      <section aria-labelledby="journey-heading" className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h2 id="journey-heading" style={{ fontFamily: 'Fraunces, serif', fontSize: '1.85rem', color: '#1E3A5F', fontWeight: 500, marginBottom: '0.5rem' }}>
            How SchemeX works
          </h2>
          <p style={{ color: '#7A8B99', fontSize: '1rem' }}>
            A complete journey — from your profile to your next action — in one place.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {JOURNEY_STEPS.map((js, i) => (
            <div key={js.step} className="p-6 rounded-lg relative" style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8' }}>
              <div className="text-xs font-mono font-semibold mb-3" style={{ color: '#E8A33D' }}>{js.step}</div>
              <div className="font-semibold mb-1" style={{ color: '#1E3A5F', fontSize: '1rem' }}>{js.label}</div>
              <div className="text-sm leading-relaxed" style={{ color: '#7A8B99' }}>{js.desc}</div>
              {i < JOURNEY_STEPS.length - 1 && (
                <span aria-hidden="true" className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-xl" style={{ color: '#E5E0D8' }}>›</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Sample result preview */}
      <section aria-labelledby="preview-heading" style={{ backgroundColor: '#1E3A5F' }} className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: '#E8A33D' }}>
                What you'll see
              </div>
              <h2 id="preview-heading" style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', color: '#FAF7F0', fontWeight: 500, lineHeight: 1.2, marginBottom: '1rem' }}>
                Not just a list of schemes. A personalised guide.
              </h2>
              <p style={{ color: '#7A8B9999', lineHeight: 1.7 }}>
                SchemeX tells you <em style={{ color: '#E8A33D', fontStyle: 'normal' }}>why</em> you qualify,
                calculates your actual benefit, shows you what's missing, and gives you one clear next step.
              </p>
            </div>
            {/* Mock dashboard card */}
            <div className="rounded-xl overflow-hidden shadow-xl" style={{ backgroundColor: '#FAF7F0' }}>
              <div className="p-5" style={{ borderBottom: '1px solid #E5E0D8' }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#7A8B99' }}>Your Best Opportunity</div>
                <div className="font-semibold text-lg mb-1" style={{ color: '#1E3A5F', fontFamily: 'Fraunces, serif' }}>
                  {featuredScheme?.name || 'Your matched scheme'}
                </div>
                <div className="text-xs mb-3" style={{ color: '#7A8B99' }}>{featuredScheme?.department || 'Based on your saved profile'}</div>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1E3A5F11', color: '#1E3A5F' }}>
                    Personalized result
                  </span>
                </div>
                <div className="rounded-lg p-4" style={{ backgroundColor: '#E8A33D11', border: '1px solid #E8A33D44' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: '#7A8B99' }}>Estimated Benefit</div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 600, color: '#1E3A5F' }}>{featuredScheme?.calculator?.enabled ? 'Calculator ready' : 'Verified benefit details'}</div>
                  <div className="text-xs mt-1" style={{ color: '#7A8B99' }}>{featuredScheme?.benefits || 'Complete your profile to see a personalized estimate.'}</div>
                </div>
              </div>
              <div className="p-5" style={{ borderBottom: '1px solid #E5E0D8' }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#C7511F' }}>What the app checks</div>
                <div className="font-semibold mb-1" style={{ color: '#1E3A5F' }}>Eligibility and missing documents</div>
                <div className="text-sm mb-2" style={{ color: '#7A8B99' }}>See why a scheme matches and what may be missing.</div>
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: '#C7511F' }}>⚠</span>
                  <span style={{ color: '#C7511F', fontWeight: 500 }}>Based on your saved profile</span>
                </div>
              </div>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#7A8B99' }}>Your Next Action</div>
                  <div className="font-semibold" style={{ color: '#1E3A5F' }}>Review your recommendations</div>
                </div>
                <button className="px-4 py-2 text-sm font-semibold rounded-md" style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}>
                  Continue →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', color: '#1E3A5F', fontWeight: 500, marginBottom: '0.75rem' }}>
          Ready to find your schemes?
        </h2>
        <p className="mb-8" style={{ color: '#7A8B99' }}>Create a profile to receive recommendations based on your actual information.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-8 py-4 text-base font-semibold rounded-md transition-all"
          style={{ backgroundColor: '#E8A33D', color: '#2D2A26' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#d4922e')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#E8A33D')}
        >
          Find My Schemes — It's Free
        </button>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #E5E0D8', backgroundColor: '#fff' }} role="contentinfo">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span style={{ fontFamily: 'Fraunces, serif', color: '#1E3A5F', fontSize: '1.1rem', fontWeight: 600 }}>
            Scheme<span style={{ color: '#E8A33D' }}>X</span>
          </span>
          <p className="text-xs" style={{ color: '#7A8B99' }}>
            SchemeX provides guidance only. Final eligibility is determined by the respective government authority.
          </p>
        </div>
      </footer>
    </div>
  );
}

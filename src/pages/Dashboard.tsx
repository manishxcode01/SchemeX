import { useState } from 'react';
import { SCHEMES, USER_PROFILE, checkEligibility, formatINR } from '../data/schemes';

interface Props {
  onNavigate: (page: string, id?: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'schemes', label: 'All Schemes' },
  { id: 'matches', label: 'My Matches' },
  { id: 'assistant', label: 'AI Assistant' },
  { id: 'admin', label: 'Admin' },
];

export default function Dashboard({ onNavigate }: Props) {
  const [activeNav, setActiveNav] = useState('dashboard');

  const results = SCHEMES.map(s => ({ scheme: s, eligibility: checkEligibility(s, USER_PROFILE) }));
  const eligible = results.filter(r => r.eligibility.status === 'ELIGIBLE');
  const nearMiss = results.filter(r => r.eligibility.status === 'NEAR_MISS');

  const totalBenefit = eligible.reduce((sum, r) => {
    if (r.scheme.calculator?.enabled) {
      const firstInput = r.scheme.calculator.inputs[0];
      const val = firstInput?.profileKey ? (USER_PROFILE as any)[firstInput.profileKey] || 500000 : 500000;
      const pct = r.scheme.calculator.percentage || 25;
      const calc = val * (pct / 100);
      const benefit = r.scheme.calculator.maxBenefit ? Math.min(calc, r.scheme.calculator.maxBenefit) : calc;
      return sum + benefit;
    }
    return sum;
  }, 0);

  const topOpportunities = [...eligible.slice(0, 3), ...nearMiss.slice(0, 2)];
  const investmentNeed = USER_PROFILE.businessInvestment || 0;
  const estimatedSupport = eligible.reduce((total, result) => {
    const calculator = result.scheme.calculator;
    if (!calculator?.enabled || !investmentNeed) return total;
    const rate = calculator.percentage ? calculator.percentage / 100 : 0;
    return total + Math.min(investmentNeed * rate, calculator.maxBenefit || Number.POSITIVE_INFINITY);
  }, 0);
  const documentChecklist = [...new Set(results.flatMap(result => result.scheme.documents.map(document => document.name)))];
  const nextGap = nearMiss.flatMap(result => result.eligibility.missing)[0];

  const handleNav = (id: string) => {
    setActiveNav(id);
    onNavigate(id);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F0', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Nav */}
      <nav style={{ borderBottom: '1px solid #E5E0D8', backgroundColor: '#fff' }} className="sticky top-0 z-50" role="navigation">
        <div className="max-w-6xl mx-auto px-6 h-15 flex items-center justify-between">
          <button onClick={() => onNavigate('landing')} style={{ fontFamily: 'Fraunces, serif', color: '#1E3A5F', fontSize: '1.2rem', fontWeight: 600 }}>
            Scheme<span style={{ color: '#E8A33D' }}>X</span>
          </button>
          <div className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className="px-3 py-2 text-sm font-medium rounded-md transition-colors"
                style={{
                  color: activeNav === item.id ? '#1E3A5F' : '#7A8B99',
                  backgroundColor: activeNav === item.id ? '#1E3A5F11' : 'transparent',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}>
              {USER_PROFILE.name[0]}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: '#7A8B99' }}>Welcome back</p>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', color: '#1E3A5F', fontWeight: 500, marginBottom: '0.35rem' }}>
            {USER_PROFILE.name}
          </h1>
          <p style={{ color: '#7A8B99' }}>
            {USER_PROFILE.businessName} · {USER_PROFILE.state} · {USER_PROFILE.businessType}
          </p>
        </div>

        {/* Overview cards */}
        <section aria-label="Overview" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="p-6 rounded-xl" style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7A8B9988' }}>
              Eligible Schemes
            </div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '3rem', fontWeight: 600, lineHeight: 1 }}>
              {eligible.length}
            </div>
              <div className="text-sm mt-2" style={{ color: '#E8A33D' }}>You appear eligible</div>
          </div>
          <div className="p-6 rounded-xl" style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8' }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7A8B99' }}>
              Almost Eligible
            </div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '3rem', fontWeight: 600, color: '#C7511F', lineHeight: 1 }}>
              {nearMiss.length}
            </div>
              <div className="text-sm mt-2" style={{ color: '#7A8B99' }}>Missing 1–2 requirements</div>
          </div>
          <div className="p-6 rounded-xl" style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8' }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7A8B99' }}>
              Estimated Potential Benefits
            </div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 600, color: '#1E3A5F', lineHeight: 1 }}>
              {formatINR(totalBenefit)}
            </div>
            <div className="text-xs mt-2 leading-relaxed" style={{ color: '#7A8B99' }}>
              Actual benefits depend on official verification and final approval.
            </div>
          </div>
        </section>

        <section className="mb-10 rounded-xl p-6" style={{ backgroundColor: '#FFF8E8', border: '1px solid #E8A33D66' }} aria-label="Financial decision summary">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#C7511F' }}>Finance decision summary</p>
              <h2 className="mt-2" style={{ fontFamily: 'Fraunces, serif', color: '#1E3A5F', fontSize: '1.6rem', fontWeight: 500 }}>Your profile points to {investmentNeed ? formatINR(estimatedSupport) : 'a personalised estimate'} in potential support.</h2>
              <p className="mt-2 text-sm" style={{ color: '#7A8B99' }}>{investmentNeed ? `Based on your ${formatINR(investmentNeed)} investment need and currently eligible calculators.` : 'Complete your financial profile to calculate subsidy and loan scenarios.'}</p>
            </div>
            <button onClick={() => onNavigate('schemes')} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}>Compare calculations →</button>
          </div>
        </section>

        {/* Next Action Banner */}
        <section aria-labelledby="next-action-heading" className="mb-10 p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ backgroundColor: '#C7511F11', border: '1.5px solid #C7511F44' }}>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#C7511F' }}>
              Your Next Action
            </div>
            <h2 id="next-action-heading" className="font-semibold text-lg" style={{ color: '#2D2A26' }}>
              {nextGap || (USER_PROFILE.name ? 'Review your eligible schemes' : 'Complete your profile')}
            </h2>
            <p className="text-sm mt-1" style={{ color: '#7A8B99' }}>
              {nextGap ? 'Resolve this requirement, then refresh your recommendations.' : 'Your recommendations are based on the information saved in your profile.'}
            </p>
          </div>
          <a
            href={nextGap?.includes('Udyam') ? 'https://udyamregistration.gov.in' : '#eligible-heading'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 text-sm font-semibold rounded-md whitespace-nowrap"
            style={{ backgroundColor: '#C7511F', color: '#fff' }}
          >
            {nextGap?.includes('Udyam') ? 'Register on Udyam →' : 'View recommendations →'}
          </a>
        </section>

        <div className="flex items-center justify-between mb-4"><h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.4rem', color: '#1E3A5F', fontWeight: 500 }}>Your recommendations</h2><button onClick={() => onNavigate('profile')} className="text-sm font-semibold" style={{ color: '#1E3A5F' }}>View / edit profile →</button></div>
        <section aria-labelledby="eligible-heading" className="mb-10">
          <h2 id="eligible-heading" className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#1E6B3C' }}>Eligible for you · {eligible.length}</h2>
          <div className="space-y-4">
            {eligible.slice(0, 5).map(({ scheme, eligibility }) => {
              const isEligible = eligibility.status === 'ELIGIBLE';
              let estimatedBenefit = 0;
              if (scheme.calculator?.enabled) {
                const firstInput = scheme.calculator.inputs[0];
                const val = firstInput?.profileKey ? (USER_PROFILE as any)[firstInput.profileKey] || 500000 : 500000;
                const pct = scheme.calculator.percentage || 25;
                const calc = val * (pct / 100);
                estimatedBenefit = scheme.calculator.maxBenefit ? Math.min(calc, scheme.calculator.maxBenefit) : calc;
              }

              return (
                <div key={scheme.id}
                  className="p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4"
                  style={{ backgroundColor: '#fff', border: `1px solid ${isEligible ? '#E5E0D8' : '#C7511F33'}` }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={isEligible
                          ? { backgroundColor: '#1E6B3C22', color: '#1E6B3C' }
                          : { backgroundColor: '#C7511F11', color: '#C7511F' }}>
                        {isEligible ? '✓ You appear eligible' : '⚠ Almost eligible'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1E3A5F11', color: '#1E3A5F' }}>
                        {scheme.category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="font-semibold mb-0.5" style={{ color: '#2D2A26' }}>{scheme.name}</div>
                    <div className="text-xs" style={{ color: '#7A8B99' }}>{scheme.department}</div>
                    {!isEligible && eligibility.missing.length > 0 && (
                      <div className="mt-2 text-sm" style={{ color: '#C7511F' }}>
                        Missing: {eligibility.missing.join(', ')}
                      </div>
                    )}
                  </div>
                  {estimatedBenefit > 0 && (
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#7A8B99' }}>
                        {isEligible ? 'Est. Benefit' : 'If eligible'}
                      </div>
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 600, color: '#1E3A5F' }}>
                        {formatINR(estimatedBenefit)}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => onNavigate('scheme-detail', scheme.id)}
                    className="px-4 py-2 text-sm font-semibold rounded-md shrink-0 transition-all"
                    style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#15304f')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1E3A5F')}
                  >
                    View Scheme
                  </button>
                </div>
              );
            })}
            {!eligible.length && <div className="p-5 rounded-xl" style={{ background: '#fff', border: '1px solid #E5E0D8', color: '#7A8B99' }}>Complete your profile to see eligible schemes.</div>}
          </div>
        </section>

        <section aria-labelledby="near-miss-heading" className="mb-10">
          <h2 id="near-miss-heading" className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#C7511F' }}>Almost eligible · {nearMiss.length}</h2>
          <div className="space-y-4">
            {nearMiss.slice(0, 5).map(({ scheme, eligibility }) => <div key={scheme.id} className="p-5 rounded-xl flex items-center gap-4" style={{ background: '#fff', border: '1px solid #C7511F33' }}><div className="flex-1"><div className="font-semibold" style={{ color: '#2D2A26' }}>{scheme.name}</div><p className="text-sm mt-1" style={{ color: '#C7511F' }}>Missing: {eligibility.missing.join(', ') || eligibility.failed.join(', ')}</p></div><button onClick={() => onNavigate('scheme-detail', scheme.id)} className="px-4 py-2 text-sm font-semibold rounded-md" style={{ background: '#1E3A5F', color: '#FAF7F0' }}>See what to fix</button></div>)}
            {!nearMiss.length && <div className="p-5 rounded-xl" style={{ background: '#fff', border: '1px solid #E5E0D8', color: '#7A8B99' }}>No near-match schemes right now.</div>}
          </div>
        </section>

        {/* Documents */}
        <section aria-labelledby="docs-heading" className="mb-10">
          <h2 id="docs-heading" style={{ fontFamily: 'Fraunces, serif', fontSize: '1.4rem', color: '#1E3A5F', fontWeight: 500, marginBottom: '1.25rem' }}>
            Your Document Checklist
          </h2>
          <div className="p-6 rounded-xl" style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documentChecklist.map(name => ({ name, have: (USER_PROFILE.documents || []).includes(name) })).map(doc => (
                <div key={doc.name} className="flex items-center gap-3 py-2">
                  <span className="text-base" aria-hidden="true">{doc.have ? '✓' : '○'}</span>
                  <span className="text-sm" style={{ color: doc.have ? '#1E6B3C' : '#C7511F', fontWeight: doc.have ? 500 : 400 }}>
                    {doc.name}
                  </span>
                  {!doc.have && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#C7511F11', color: '#C7511F' }}>
                      Missing
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ask SchemeX */}
        <section className="p-6 rounded-xl" style={{ backgroundColor: '#1E3A5F' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#E8A33D' }}>
                Ask SchemeX
              </div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', color: '#FAF7F0', fontWeight: 500 }}>
                Have a question about your schemes?
              </div>
              <p className="text-sm mt-1" style={{ color: '#7A8B9999' }}>
                Ask in plain language — or use your voice. SchemeX explains, guides, and never guesses.
              </p>
            </div>
            <button
              onClick={() => onNavigate('assistant')}
              className="px-5 py-2.5 text-sm font-semibold rounded-md whitespace-nowrap"
              style={{ backgroundColor: '#E8A33D', color: '#2D2A26' }}
            >
              🎤 Open Assistant
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

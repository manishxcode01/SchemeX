import { useState } from 'react';
import { SCHEMES, USER_PROFILE, checkEligibility, Scheme } from '../data/schemes';

interface Props {
  onNavigate: (page: string, id?: string) => void;
}

const CATEGORIES = ['All', 'funding', 'subsidy', 'loan', 'training', 'equipment', 'market_access'];
const CATEGORY_LABELS: Record<string, string> = {
  funding: 'Funding', subsidy: 'Subsidy', loan: 'Loan', training: 'Training',
  equipment: 'Equipment', market_access: 'Market Access',
};

export default function Schemes({ onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const results = SCHEMES.map(s => ({ scheme: s, eligibility: checkEligibility(s, USER_PROFILE) }));

  const filtered = results.filter(({ scheme, eligibility }) => {
    const q = query.toLowerCase();
    const matchesQuery = !q || scheme.name.toLowerCase().includes(q) ||
      scheme.description.toLowerCase().includes(q) ||
      scheme.tags.some(t => t.includes(q)) ||
      scheme.department.toLowerCase().includes(q);
    const matchesCat = category === 'All' || scheme.category === category;
    const matchesStatus = filterStatus === 'All' ||
      (filterStatus === 'Eligible' && eligibility.status === 'ELIGIBLE') ||
      (filterStatus === 'Near-Miss' && eligibility.status === 'NEAR_MISS');
    return matchesQuery && matchesCat && matchesStatus;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F0', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #E5E0D8', backgroundColor: '#fff' }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => onNavigate('landing')} style={{ fontFamily: 'Fraunces, serif', color: '#1E3A5F', fontSize: '1.2rem', fontWeight: 600 }}>
            Scheme<span style={{ color: '#E8A33D' }}>X</span>
          </button>
          <span style={{ color: '#E5E0D8' }}>›</span>
          <span className="text-sm" style={{ color: '#7A8B99' }}>All Schemes</span>
          <div className="ml-auto flex gap-3">
            <button onClick={() => onNavigate('dashboard')} className="text-sm font-medium" style={{ color: '#7A8B99' }}>Dashboard</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', color: '#1E3A5F', fontWeight: 500, marginBottom: '0.4rem' }}>
            Government Schemes
          </h1>
          <p style={{ color: '#7A8B99' }}>
            Browse {SCHEMES.length} verified schemes. Eligibility is checked against your profile automatically.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" aria-hidden="true" style={{ color: '#7A8B99' }}>🔍</span>
            <input
              type="search"
              placeholder="Search schemes, departments, or describe what you need…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg text-sm"
              style={{ border: '1.5px solid #E5E0D8', backgroundColor: '#fff', color: '#2D2A26', outline: 'none' }}
              aria-label="Search schemes"
              onFocus={e => (e.currentTarget.style.borderColor = '#1E3A5F')}
              onBlur={e => (e.currentTarget.style.borderColor = '#E5E0D8')}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className="px-3 py-1.5 text-xs font-semibold rounded-full transition-colors"
                style={{
                  backgroundColor: category === c ? '#1E3A5F' : '#fff',
                  color: category === c ? '#FAF7F0' : '#7A8B99',
                  border: `1px solid ${category === c ? '#1E3A5F' : '#E5E0D8'}`,
                }}
              >
                {c === 'All' ? 'All Categories' : CATEGORY_LABELS[c]}
              </button>
            ))}
            <div className="ml-auto flex gap-2">
              {['All', 'Eligible', 'Near-Miss'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-full transition-colors"
                  style={{
                    backgroundColor: filterStatus === s ? '#E8A33D' : '#fff',
                    color: filterStatus === s ? '#2D2A26' : '#7A8B99',
                    border: `1px solid ${filterStatus === s ? '#E8A33D' : '#E5E0D8'}`,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm" style={{ color: '#7A8B99' }}>
          Showing {filtered.length} of {SCHEMES.length} schemes
        </div>

        {/* Scheme cards */}
        <div className="space-y-4">
          {filtered.map(({ scheme, eligibility }) => (
            <SchemeCard key={scheme.id} scheme={scheme} eligibility={eligibility} onView={() => onNavigate('scheme-detail', scheme.id)} viewLabel="View Details" />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🔍</div>
              <div className="font-semibold mb-2" style={{ color: '#1E3A5F' }}>No schemes found</div>
              <div className="text-sm" style={{ color: '#7A8B99' }}>Try a different search term or clear your filters.</div>
              <button onClick={() => { setQuery(''); setCategory('All'); setFilterStatus('All'); }}
                className="mt-4 text-sm font-medium" style={{ color: '#E8A33D' }}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SchemeCard({ scheme, eligibility, onView, viewLabel }: {
  scheme: Scheme;
  eligibility: ReturnType<typeof checkEligibility>;
  onView: () => void;
  viewLabel: string;
}) {
  const isEligible = eligibility.status === 'ELIGIBLE';
  const isNearMiss = eligibility.status === 'NEAR_MISS';

  return (
    <article
      className="p-6 rounded-xl transition-shadow"
      style={{ backgroundColor: '#fff', border: `1px solid ${isNearMiss ? '#C7511F33' : '#E5E0D8'}` }}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {isEligible && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#1E6B3C22', color: '#1E6B3C' }}>
                ✓ You appear eligible
              </span>
            )}
            {isNearMiss && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#C7511F11', color: '#C7511F' }}>
                ⚠ Almost eligible
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1E3A5F11', color: '#1E3A5F' }}>
              {CATEGORY_LABELS[scheme.category] || scheme.category}
            </span>
          </div>

          <h3 className="font-semibold text-lg mb-0.5" style={{ color: '#2D2A26' }}>{scheme.name}</h3>
          <div className="text-xs mb-3" style={{ color: '#7A8B99' }}>{scheme.department}</div>
          <p className="text-sm leading-relaxed" style={{ color: '#7A8B99' }}>
            {scheme.description.slice(0, 150)}…
          </p>

          {isNearMiss && eligibility.missing.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: '#C7511F' }}>Missing:</span>
              {eligibility.missing.map(m => (
                <span key={m} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#C7511F11', color: '#C7511F', border: '1px solid #C7511F33' }}>
                  {m}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-1">
            {scheme.tags.slice(0, 4).map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FAF7F0', color: '#7A8B99', border: '1px solid #E5E0D8' }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xs" style={{ color: '#7A8B99' }}>Match score</div>
            <div className="font-semibold" style={{ color: '#1E3A5F' }}>{eligibility.matchScore}%</div>
          </div>
          {scheme.calculator?.enabled && (
            <div className="text-right">
              <div className="text-xs" style={{ color: '#7A8B99' }}>Calculator</div>
              <div className="text-xs font-semibold" style={{ color: '#E8A33D' }}>✓ Available</div>
            </div>
          )}
          <button
            onClick={onView}
            className="px-4 py-2 text-sm font-semibold rounded-md transition-all"
            style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#15304f')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1E3A5F')}
          >
            {viewLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

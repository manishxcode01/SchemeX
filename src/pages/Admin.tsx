import { useEffect, useState } from 'react';
import { SCHEMES } from '../data/schemes';
import { archiveScheme, createScheme, fetchPlatformStats, importSchemes, type PlatformStats, updateScheme } from '../data/api';
import type { Scheme } from '../data/schemes';
import { getCurrentUser, isCurrentUserAdmin } from '../data/auth';

interface Props {
  onNavigate: (page: string) => void;
}

type AdminSection = 'dashboard' | 'schemes' | 'import' | 'users' | 'analytics';

const IMPORT_STEPS = ['Upload File', 'Map Fields', 'Validate', 'Preview', 'Import'];

export default function Admin({ onNavigate }: Props) {
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [importStep, setImportStep] = useState(0);
  const [importFile, setImportFile] = useState<string | null>(null);
  const [editingScheme, setEditingScheme] = useState<string | null>(null);
  const [schemeList, setSchemeList] = useState<Scheme[]>(SCHEMES);
  const [actionMessage, setActionMessage] = useState('');
  const [importedSchemes, setImportedSchemes] = useState<Scheme[]>([]);
  const [stats, setStats] = useState<PlatformStats>({ users: 0, schemes: SCHEMES.length, eligibleMatches: 0, nearMissMatches: 0 });
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied'>('checking');

  useEffect(() => {
    Promise.all([getCurrentUser(), isCurrentUserAdmin()]).then(([user, admin]) => {
      setAccess(user && admin ? 'allowed' : 'denied');
      if (user && admin) fetchPlatformStats().then(setStats).catch(() => undefined);
    });
  }, []);

  const STATS = [
    { label: 'Total Users', value: stats.users.toLocaleString(), change: 'Stored profiles' },
    { label: 'Published Schemes', value: stats.schemes.toString(), change: 'Live database count' },
    { label: 'Eligible Matches', value: stats.eligibleMatches.toLocaleString(), change: 'Tracked matches' },
    { label: 'Near-Miss Matches', value: stats.nearMissMatches.toLocaleString(), change: 'Actionable matches' },
  ];

  const NAV: { id: AdminSection; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'schemes', label: 'Schemes', icon: '📋' },
    { id: 'import', label: 'Import Data', icon: '📥' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ];

  const categoryCounts = SCHEMES.reduce<Record<string, number>>((counts, scheme) => {
    counts[scheme.category] = (counts[scheme.category] || 0) + 1;
    return counts;
  }, {});
  const audienceCounts = SCHEMES.reduce<Record<string, number>>((counts, scheme) => {
    scheme.targetAudience.forEach(audience => { counts[audience] = (counts[audience] || 0) + 1; });
    return counts;
  }, {});
  const analyticsGroups = [
    { title: 'Published categories', items: Object.entries(categoryCounts).map(([label, value]) => ({ label, value })) },
    { title: 'Catalog audiences', items: Object.entries(audienceCounts).sort(([, first], [, second]) => second - first).slice(0, 5).map(([label, value]) => ({ label, value })) },
  ];

  async function handleCreateScheme() {
    const name = window.prompt('Scheme name')?.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const base = schemeList[0];
    if (!base) return;
    try {
      const scheme = { ...base, id: `${id}-${Date.now()}`, name };
      await createScheme(scheme);
      setSchemeList(current => [...current, scheme]);
      setActionMessage('Scheme created and saved.');
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Could not create scheme.');
    }
  }

  async function handleEditScheme(scheme: Scheme) {
    const name = window.prompt('Update scheme name', scheme.name)?.trim();
    if (!name || name === scheme.name) return;
    try {
      await updateScheme(scheme.id, { name });
      setSchemeList(current => current.map(item => item.id === scheme.id ? { ...item, name } : item));
      setActionMessage('Scheme updated and saved.');
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Could not update scheme.');
    }
  }

  async function handleArchiveScheme(id: string) {
    if (!window.confirm('Archive this scheme? It will no longer be public.')) return;
    try {
      await archiveScheme(id);
      setSchemeList(current => current.filter(item => item.id !== id));
      setActionMessage('Scheme archived.');
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Could not archive scheme.');
    }
  }

  async function handleSchemeFile(file: File) {
    setActionMessage('');
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const records = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' && 'schemes' in parsed ? (parsed as { schemes: unknown }).schemes : null);
      if (!Array.isArray(records) || records.length === 0) throw new Error('Use a JSON array of scheme records or { "schemes": [...] }.');
      const valid = records.filter((item): item is Scheme => {
        if (!item || typeof item !== 'object') return false;
        const scheme = item as Partial<Scheme>;
        return typeof scheme.id === 'string' && typeof scheme.name === 'string' && typeof scheme.department === 'string' && typeof scheme.description === 'string' && typeof scheme.benefits === 'string' && typeof scheme.eligibilityText === 'string' && typeof scheme.officialUrl === 'string' && typeof scheme.lastVerified === 'string' && Array.isArray(scheme.targetAudience) && Array.isArray(scheme.documents) && Array.isArray(scheme.applicationProcess) && Array.isArray(scheme.tags) && !!scheme.rules;
      });
      if (valid.length !== records.length) throw new Error('Every record must match the full scheme model: identity, audience, benefits, eligibility, rules, documents, application steps, official URL, verification date, and tags.');
      setImportedSchemes(valid);
      setImportFile(file.name);
      setActionMessage(`${valid.length} valid scheme records ready. Review and commit them.`);
      setImportStep(2);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Could not read this JSON file.');
    }
  }

  async function commitImportedSchemes() {
    try {
      await importSchemes(importedSchemes);
      setSchemeList(current => {
        const byId = new Map(current.map(scheme => [scheme.id, scheme]));
        importedSchemes.forEach(scheme => byId.set(scheme.id, scheme));
        return [...byId.values()];
      });
      setActionMessage(`${importedSchemes.length} schemes saved to the catalog.`);
      setImportStep(3);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Could not save schemes to Supabase.');
    }
  }

  if (access === 'checking') return <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF7F0', color: '#7A8B99' }}>Checking admin access...</div>;
  if (access === 'denied') return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#FAF7F0', color: '#1E3A5F' }}>
      <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem' }}>Admin access required</h1>
      <p style={{ color: '#7A8B99' }}>Sign in with the approved administrator account.</p>
      <button onClick={() => onNavigate('login')} className="px-5 py-3 rounded-lg font-semibold" style={{ background: '#1E3A5F', color: '#FAF7F0' }}>Go to login</button>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#FAF7F0', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside className="w-56 min-h-screen flex-shrink-0" style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}>
        <div className="p-5 border-b border-white/10">
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 600 }}>
            Scheme<span style={{ color: '#E8A33D' }}>X</span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#7A8B9988' }}>Admin Panel</div>
        </div>
        <nav className="p-3 space-y-1">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors"
              style={{
                backgroundColor: section === item.id ? '#ffffff18' : 'transparent',
                color: section === item.id ? '#FAF7F0' : '#7A8B9999',
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-6 left-0 w-56 p-3">
          <button
            onClick={() => onNavigate('landing')}
            className="w-full text-xs px-3 py-2 rounded-lg text-left"
            style={{ color: '#7A8B9988' }}
          >
            ← Back to site
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen overflow-auto">
        <div className="p-8">
          {section === 'dashboard' && (
            <div>
              <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: '#1E3A5F', fontWeight: 500, marginBottom: '0.25rem' }}>
                Admin Dashboard
              </h1>
              <p className="text-sm mb-8" style={{ color: '#7A8B99' }}>
                Platform overview · Updated just now
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {STATS.map(stat => (
                  <div key={stat.label} className="p-5 rounded-xl" style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7A8B99' }}>
                      {stat.label}
                    </div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 600, color: '#1E3A5F', lineHeight: 1 }}>
                      {stat.value}
                    </div>
                    <div className="text-xs mt-2" style={{ color: '#E8A33D' }}>{stat.change}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl" style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8' }}>
                  <div className="p-5 border-b" style={{ borderColor: '#E5E0D8' }}>
                    <h2 className="font-semibold" style={{ color: '#1E3A5F' }}>Catalog records</h2>
                  </div>
                  <div className="p-5 space-y-3">
                    {SCHEMES.slice(0, 5).map((scheme, i) => (
                      <div key={scheme.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 text-xs flex items-center justify-center rounded font-semibold"
                            style={{ backgroundColor: '#1E3A5F11', color: '#1E3A5F' }}>
                            {i + 1}
                          </span>
                          <span style={{ color: '#2D2A26' }} className="truncate max-w-48">{scheme.name}</span>
                        </div>
                        <span style={{ color: '#7A8B99' }}>Published</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl" style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8' }}>
                  <div className="p-5 border-b" style={{ borderColor: '#E5E0D8' }}>
                    <h2 className="font-semibold" style={{ color: '#1E3A5F' }}>Scheme Status</h2>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      { label: 'Published', count: SCHEMES.length, color: '#1E6B3C' },
                      { label: 'In Review', count: 0, color: '#E8A33D' },
                      { label: 'Draft', count: 0, color: '#7A8B99' },
                      { label: 'Calculator Enabled', count: SCHEMES.filter(s => s.calculator?.enabled).length, color: '#1E3A5F' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                          <span style={{ color: '#2D2A26' }}>{row.label}</span>
                        </div>
                        <span className="font-semibold" style={{ color: row.color }}>{row.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'schemes' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: '#1E3A5F', fontWeight: 500 }}>
                    Scheme Management
                  </h1>
                  <p className="text-sm mt-0.5" style={{ color: '#7A8B99' }}>{schemeList.length} schemes · All published</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSection('import')}
                    className="px-4 py-2 text-sm font-semibold rounded-lg"
                    style={{ backgroundColor: '#FAF7F0', color: '#1E3A5F', border: '1.5px solid #1E3A5F' }}>
                    Import Data
                  </button>
                  <button onClick={handleCreateScheme} className="px-4 py-2 text-sm font-semibold rounded-lg"
                    style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}>
                    + New Scheme
                  </button>
                </div>
              </div>

              {actionMessage && <p className="mb-4 text-sm" style={{ color: '#1E6B3C' }}>{actionMessage}</p>}

              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D8' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#FAF7F0' }}>
                      {['Scheme Name', 'Department', 'Category', 'Calculator', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                          style={{ color: '#7A8B99', borderBottom: '1px solid #E5E0D8' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ backgroundColor: '#fff' }}>
                    {schemeList.map((scheme, i) => (
                      <tr key={scheme.id} style={{ borderBottom: i < schemeList.length - 1 ? '1px solid #E5E0D8' : 'none' }}>
                        <td className="px-4 py-3">
                          <div className="font-medium" style={{ color: '#2D2A26' }}>{scheme.name}</div>
                          <div className="text-xs mt-0.5" style={{ color: '#7A8B99' }}>{scheme.targetAudience.slice(0, 2).join(', ')}</div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#7A8B99' }}>{scheme.department}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1E3A5F11', color: '#1E3A5F' }}>
                            {scheme.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {scheme.calculator?.enabled
                            ? <span className="text-xs" style={{ color: '#1E6B3C' }}>✓ Active</span>
                            : <span className="text-xs" style={{ color: '#7A8B99' }}>–</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: '#1E6B3C22', color: '#1E6B3C' }}>
                            Published
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleEditScheme(scheme)} className="text-xs font-medium" style={{ color: '#1E3A5F' }}>Edit</button>
                            <button onClick={() => handleArchiveScheme(scheme.id)} className="text-xs font-medium" style={{ color: '#7A8B99' }}>Archive</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'import' && (
            <div>
              <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: '#1E3A5F', fontWeight: 500, marginBottom: '0.25rem' }}>
                Import Scheme Data
              </h1>
              <p className="text-sm mb-8" style={{ color: '#7A8B99' }}>
                Upload CSV, JSON, or XLSX. We'll detect columns, map fields, and preview before importing.
              </p>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-8">
                {IMPORT_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{
                          backgroundColor: i <= importStep ? '#1E3A5F' : '#E5E0D8',
                          color: i <= importStep ? '#FAF7F0' : '#7A8B99',
                        }}>
                        {i < importStep ? '✓' : i + 1}
                      </div>
                      <span className="text-xs font-medium hidden sm:block" style={{ color: i === importStep ? '#1E3A5F' : '#7A8B99' }}>
                        {step}
                      </span>
                    </div>
                    {i < IMPORT_STEPS.length - 1 && (
                      <div className="w-6 h-px" style={{ backgroundColor: i < importStep ? '#1E3A5F' : '#E5E0D8' }} />
                    )}
                  </div>
                ))}
              </div>

              {importStep === 0 && (
                <div className="max-w-lg">
                  <input id="scheme-json-file" type="file" accept="application/json,.json" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) handleSchemeFile(file); }} />
                  <div
                    className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors"
                    style={{ borderColor: importFile ? '#1E3A5F' : '#E5E0D8', backgroundColor: '#fff' }}
                    onClick={() => document.getElementById('scheme-json-file')?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleSchemeFile(file); }}
                  >
                    <div className="text-4xl mb-4" aria-hidden="true">📄</div>
                    {importFile ? (
                      <div>
                        <div className="font-semibold" style={{ color: '#1E3A5F' }}>{importFile}</div>
                        <div className="text-sm mt-1" style={{ color: '#7A8B99' }}>JSON file ready to review</div>
                      </div>
                    ) : (
                      <>
                        <div className="font-semibold mb-1" style={{ color: '#2D2A26' }}>Drop your file here</div>
                        <div className="text-sm" style={{ color: '#7A8B99' }}>Supports JSON scheme records</div>
                        <div className="text-sm mt-1" style={{ color: '#7A8B99' }}>or click to browse</div>
                      </>
                    )}
                  </div>
                  {actionMessage && <p className="mt-4 text-sm" style={{ color: actionMessage.includes('valid') ? '#1E6B3C' : '#C7511F' }}>{actionMessage}</p>}
                </div>
              )}

              {importStep === 1 && (
                <div className="max-w-2xl">
                  <div className="p-5 rounded-xl mb-5" style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8' }}>
                    <h2 className="font-semibold mb-4" style={{ color: '#1E3A5F' }}>Detected Column Mapping</h2>
                    <div className="space-y-3">
                      {[
                        ['scheme_title', 'scheme_name', 'Auto-detected'],
                        ['ministry', 'department', 'Auto-detected'],
                        ['category_type', 'category', 'Auto-detected'],
                        ['description_text', 'description', 'Auto-detected'],
                        ['benefit_amount', 'maximum_benefit', 'Auto-detected'],
                        ['eligibility_notes', 'eligibility_text', 'Needs review'],
                        ['apply_link', 'official_url', 'Auto-detected'],
                      ].map(([source, target, status]) => (
                        <div key={source} className="flex items-center gap-4 text-sm">
                          <span className="w-36 font-mono text-xs px-2 py-1 rounded" style={{ backgroundColor: '#FAF7F0', color: '#7A8B99' }}>
                            {source}
                          </span>
                          <span aria-hidden="true" style={{ color: '#E8A33D' }}>→</span>
                          <span className="flex-1" style={{ color: '#2D2A26' }}>{target}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: status === 'Auto-detected' ? '#1E6B3C22' : '#C7511F11', color: status === 'Auto-detected' ? '#1E6B3C' : '#C7511F' }}>
                            {status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setImportStep(0)} className="px-4 py-2 text-sm" style={{ color: '#7A8B99' }}>← Back</button>
                    <button onClick={() => setImportStep(2)} className="flex-1 py-2 text-sm font-semibold rounded-lg"
                      style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}>
                      Validate Data →
                    </button>
                  </div>
                </div>
              )}

              {importStep === 2 && (
                <div className="max-w-2xl">
                  <div className="p-5 rounded-xl mb-5" style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8' }}>
                    <h2 className="font-semibold mb-1" style={{ color: '#1E3A5F' }}>Import Preview</h2>
                    <p className="text-xs mb-5" style={{ color: '#7A8B99' }}>{importedSchemes.length} validated records from {importFile || 'the selected file'}.</p>
                    <div className="grid grid-cols-3 gap-4 mb-5">
                      {[
                        { label: 'Total Rows', value: importedSchemes.length, color: '#1E3A5F' },
                        { label: 'Valid', value: importedSchemes.length, color: '#1E6B3C' },
                        { label: 'Updates', value: importedSchemes.filter(scheme => schemeList.some(existing => existing.id === scheme.id)).length, color: '#7A8B99' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="p-3 rounded-lg text-center" style={{ backgroundColor: '#FAF7F0' }}>
                          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 600, color }}>{value}</div>
                          <div className="text-xs" style={{ color: '#7A8B99' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setImportStep(1)} className="px-4 py-2 text-sm" style={{ color: '#7A8B99' }}>← Back</button>
                    <button onClick={commitImportedSchemes} className="flex-1 py-2 text-sm font-semibold rounded-lg"
                      style={{ backgroundColor: '#E8A33D', color: '#2D2A26' }}>
                      Save {importedSchemes.length} schemes →
                    </button>
                  </div>
                </div>
              )}

              {importStep === 3 && (
                <div className="max-w-md text-center py-12">
                  <div className="text-5xl mb-4">✓</div>
                  <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', color: '#1E3A5F', fontWeight: 500 }}>
                    Import Successful
                  </h2>
                  <p className="text-sm mt-2 mb-6" style={{ color: '#7A8B99' }}>
                    {importedSchemes.length} schemes saved to Supabase and available to the published catalog.
                  </p>
                  <button onClick={() => { setSection('schemes'); setImportStep(0); setImportFile(null); }}
                    className="px-6 py-3 text-sm font-semibold rounded-lg"
                    style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}>
                    Review Imported Schemes
                  </button>
                </div>
              )}
            </div>
          )}

          {section === 'analytics' && (
            <div>
              <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: '#1E3A5F', fontWeight: 500, marginBottom: '1.5rem' }}>
                Analytics
              </h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analyticsGroups.map(({ title, items }) => (
                  <div key={title} className="p-5 rounded-xl" style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8' }}>
                    <h2 className="font-semibold mb-4" style={{ color: '#1E3A5F' }}>{title}</h2>
                    <div className="space-y-3">
                      {items.map(({ label, value }) => {
                        const max = items[0].value;
                        return (
                          <div key={label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span style={{ color: '#2D2A26' }}>{label}</span>
                              <span style={{ color: '#7A8B99' }}>{value} schemes</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#FAF7F0' }}>
                              <div className="h-full rounded-full" style={{ width: `${max ? (value / max) * 100 : 0}%`, backgroundColor: '#1E3A5F' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'users' && (
            <div>
              <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: '#1E3A5F', fontWeight: 500, marginBottom: '1.5rem' }}>
                Users
              </h1>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D8', backgroundColor: '#fff' }}>
                <div className="p-4 border-b text-sm font-semibold" style={{ borderColor: '#E5E0D8', color: '#7A8B99' }}>
                  {stats.users.toLocaleString()} registered profiles
                </div>
                <div className="p-6 text-sm" style={{ color: '#7A8B99' }}>Profile records are protected by Supabase RLS. The count above reflects stored profiles; individual profile data is not exposed here.</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

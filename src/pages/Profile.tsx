import { useState } from 'react'
import { saveProfile } from '../data/auth'
import { SCHEMES, USER_PROFILE, hydrateData } from '../data/schemes'

interface Props { onNavigate: (page: string) => void }

const fields = [
  ['name', 'Full name'], ['age', 'Age'], ['state', 'State'], ['district', 'District'],
  ['businessName', 'Business name'], ['businessType', 'Business type'], ['industry', 'Industry'],
  ['annualIncome', 'Annual personal income'], ['annualTurnover', 'Annual business turnover'],
  ['businessInvestment', 'Investment required'], ['employeeCount', 'Employee count'], ['yearsInOperation', 'Years in operation'],
] as const

export default function Profile({ onNavigate }: Props) {
  const [profile, setProfile] = useState({ ...USER_PROFILE })
  const [message, setMessage] = useState('')
  const documentOptions = ['Aadhaar Card', 'PAN Card', 'Bank Account Details', 'Udyam Registration Certificate', 'GST Certificate', 'Income Certificate', 'Project Report', 'Educational Certificate']
  const update = (key: string, value: string) => setProfile(current => ({ ...current, [key]: ['age', 'annualIncome', 'annualTurnover', 'businessInvestment', 'employeeCount', 'yearsInOperation'].includes(key) ? Number(value) : value }))
  const save = async () => {
    try {
      const saved = await saveProfile(profile)
      if (saved) hydrateData({ schemes: SCHEMES, profile: saved })
      setMessage('Your profile was saved. Recommendations will use these details.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save your profile.')
    }
  }

  return <div className="min-h-screen" style={{ background: '#FAF7F0', fontFamily: 'Inter, sans-serif' }}>
    <nav className="sticky top-0 z-50 border-b" style={{ background: '#fff', borderColor: '#E5E0D8' }}>
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between"><button onClick={() => onNavigate('dashboard')} style={{ fontFamily: 'Fraunces, serif', color: '#1E3A5F', fontWeight: 600 }}>Scheme<span style={{ color: '#E8A33D' }}>X</span></button><button onClick={() => onNavigate('dashboard')} className="text-sm" style={{ color: '#7A8B99' }}>Back to dashboard</button></div>
    </nav>
    <main className="max-w-5xl mx-auto px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#C7511F' }}>Your saved information</p>
      <h1 className="mt-2" style={{ fontFamily: 'Fraunces, serif', color: '#1E3A5F', fontSize: '2.2rem', fontWeight: 500 }}>Profile and preferences</h1>
      <p className="mt-2 mb-8 text-sm" style={{ color: '#7A8B99' }}>Update these details anytime. They power eligibility matches and finance estimates.</p>
      <div className="grid md:grid-cols-2 gap-4">
        {fields.map(([key, label]) => <label key={key} className="block"><span className="block text-xs font-semibold mb-1.5" style={{ color: '#2D2A26' }}>{label}</span><input value={String(profile[key] ?? '')} type={['age', 'annualIncome', 'annualTurnover', 'businessInvestment', 'employeeCount', 'yearsInOperation'].includes(key) ? 'number' : 'text'} onChange={event => update(key, event.target.value)} className="w-full rounded-lg px-3 py-2.5" style={{ background: '#fff', border: '1px solid #E5E0D8' }} /></label>)}
      </div>
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {[['udyamRegistered', 'Udyam registered'], ['gstRegistered', 'GST registered'], ['isArtisan', 'Artisan / weaver']].map(([key, label]) => <label key={key} className="flex items-center gap-3 p-4 rounded-lg" style={{ background: '#fff', border: '1px solid #E5E0D8' }}><input type="checkbox" checked={Boolean(profile[key as keyof typeof profile])} onChange={event => setProfile(current => ({ ...current, [key]: event.target.checked }))} /><span className="text-sm" style={{ color: '#2D2A26' }}>{label}</span></label>)}
      </div>
      <section className="mt-8 p-5 rounded-xl" style={{ background: '#fff', border: '1px solid #E5E0D8' }}><h2 className="font-semibold" style={{ color: '#1E3A5F' }}>Documents you already have</h2><p className="text-sm mt-1 mb-4" style={{ color: '#7A8B99' }}>This is compared against each scheme’s required documents.</p><div className="grid sm:grid-cols-2 gap-3">{documentOptions.map(document => <label key={document} className="flex items-center gap-3 text-sm" style={{ color: '#2D2A26' }}><input type="checkbox" checked={profile.documents.includes(document)} onChange={event => setProfile(current => ({ ...current, documents: event.target.checked ? [...current.documents, document] : current.documents.filter(item => item !== document) }))} />{document}</label>)}</div></section>
      <div className="mt-8 flex items-center gap-4"><button onClick={save} className="rounded-lg px-5 py-3 font-semibold" style={{ background: '#1E3A5F', color: '#FAF7F0' }}>Save profile</button>{message && <span className="text-sm" style={{ color: '#1E6B3C' }}>{message}</span>}</div>
    </main>
  </div>
}

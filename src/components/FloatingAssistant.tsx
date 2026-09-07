import { useState } from 'react'
import { USER_PROFILE } from '../data/schemes'

interface Props { open: boolean; onOpen: () => void; onClose: () => void }

function answerBasicQuestion(question: string) {
  const normalized = question.toLowerCase().trim()
  if (normalized.includes('what is my name') || normalized === 'name' || normalized.includes('who am i')) {
    return USER_PROFILE.name ? `Your saved name is ${USER_PROFILE.name}.` : 'Your name is not saved yet. Complete your profile or update it from the Profile page.'
  }
  if (normalized === 'schemex' || normalized.includes('what is schemex') || normalized.includes('about schemex')) {
    return 'SchemeX is a government-scheme finder for Indian entrepreneurs. It compares your profile with verified scheme rules, explains eligibility, identifies missing documents, estimates benefits, and shows practical application steps.'
  }
  return 'I am checking your saved profile and published scheme data. Open your dashboard for the detailed eligibility and calculator result.'
}

export default function FloatingAssistant({ open, onOpen, onClose }: Props) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hi. Ask me about your eligible schemes, missing documents, or finance estimates.' }])
  const sendMessage = () => {
    if (!input.trim()) return
    const question = input.trim()
    setMessages(current => [...current, { role: 'user', text: question }, { role: 'assistant', text: answerBasicQuestion(question) }])
    setInput('')
  }

  return (
    <>
      {open && <section className="fixed bottom-20 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl shadow-2xl" style={{ height: 'min(480px, calc(100vh - 7rem))', background: '#FAF7F0', border: '1px solid #E5E0D8' }} aria-label="SchemeX chat assistant">
        <header className="flex items-center justify-between px-4 py-3" style={{ background: '#1E3A5F', color: '#FAF7F0' }}><div><div className="font-semibold">SchemeX Assistant</div><div className="text-xs" style={{ color: '#C9D3DF' }}>Personalized chat</div></div><button onClick={onClose} aria-label="Close assistant" className="text-xl">×</button></header>
        <div className="flex-1 space-y-3 overflow-y-auto p-3">{messages.map((message, index) => <div key={index} className={`max-w-[88%] rounded-xl px-3 py-2 text-sm ${message.role === 'user' ? 'ml-auto' : ''}`} style={{ background: message.role === 'user' ? '#1E3A5F' : '#fff', color: message.role === 'user' ? '#FAF7F0' : '#2D2A26', border: message.role === 'assistant' ? '1px solid #E5E0D8' : 'none' }}>{message.text}</div>)}</div>
        <div className="flex gap-2 border-t p-3" style={{ borderColor: '#E5E0D8', background: '#fff' }}><input value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => event.key === 'Enter' && sendMessage()} placeholder="Ask about your schemes..." className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #E5E0D8' }} /><button onClick={sendMessage} className="rounded-lg px-3 text-sm font-semibold" style={{ background: '#E8A33D', color: '#2D2A26' }}>Send</button></div>
      </section>}
      <button type="button" onClick={open ? onClose : onOpen} className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg" style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0', boxShadow: '0 10px 24px rgba(30, 58, 95, 0.25)' }} aria-label={open ? 'Close SchemeX assistant' : 'Open SchemeX assistant'} title="Ask SchemeX"><span aria-hidden="true">{open ? '×' : '✦'}</span><span className="hidden sm:inline">{open ? 'Close' : 'Ask SchemeX'}</span></button>
    </>
  )
}

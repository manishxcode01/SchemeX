import { useState } from 'react';
import { EMPTY_PROFILE, SCHEMES, hydrateData } from '../data/schemes';
import { saveProfile } from '../data/auth';

interface Props {
  onNavigate: (page: string) => void;
}

const STEPS = [
  {
    id: 'name', step: 1, question: "What's your name?", type: 'text', field: 'name',
    placeholder: 'Full name', hint: 'We use this to personalise your experience.',
  },
  {
    id: 'age', step: 2, question: "How old are you?", type: 'number', field: 'age',
    placeholder: 'Your age', hint: 'Age determines eligibility for several schemes.',
  },
  {
    id: 'gender', step: 3, question: "What is your gender?", type: 'choice', field: 'gender',
    choices: ['Male', 'Female', 'Transgender', 'Prefer not to say'],
    hint: 'Some schemes have specific eligibility for women and transgender entrepreneurs.',
  },
  {
    id: 'state', step: 4, question: "Which state are you in?", type: 'choice', field: 'state',
    choices: ['Punjab', 'Maharashtra', 'Gujarat', 'Tamil Nadu', 'Rajasthan', 'Uttar Pradesh', 'Karnataka', 'West Bengal', 'Madhya Pradesh', 'Other'],
    hint: 'Many schemes are state-specific.',
  },
  {
    id: 'business', step: 5, question: "What kind of business do you have?", type: 'choice', field: 'businessType',
    choices: ['Manufacturing', 'Services', 'Trading', 'Agriculture & Allied', 'Handicrafts & Artisan', 'Not yet started'],
    hint: 'This determines which sector schemes you qualify for.',
  },
  {
    id: 'stage', step: 6, question: "What stage is your business at?", type: 'choice', field: 'businessStage',
    choices: ['Idea stage (not started)', 'Just started (under 1 year)', 'Early stage (1–3 years)', 'Growing (3+ years)'],
    hint: 'Some schemes support startups, others require established businesses.',
  },
  {
    id: 'category', step: 7, question: "Do you belong to any of these entrepreneur categories?", type: 'choice', field: 'entrepreneurCategory',
    choices: ['General', 'SC (Scheduled Caste)', 'ST (Scheduled Tribe)', 'OBC', 'Women Entrepreneur', 'Differently Abled', 'Ex-Serviceman'],
    hint: 'These categories unlock reserved schemes and higher subsidies.',
  },
  {
    id: 'needs', step: 8, question: "What kind of support are you looking for?", type: 'choice', field: 'needs',
    choices: ['Funding / Loan', 'Equipment / Technology', 'Training / Skill Development', 'Market Access', 'Subsidy on Investment', 'Working Capital'],
    hint: 'We\'ll prioritise schemes that match your immediate needs.',
  },
  { id: 'district', step: 9, question: 'Which district are you based in?', type: 'text', field: 'district', placeholder: 'District', hint: 'District details help with local and state-level opportunities.' },
  { id: 'businessName', step: 10, question: 'What is your business or venture called?', type: 'text', field: 'businessName', placeholder: 'Business name', hint: 'Use your registered name, or a working name if you are just starting.' },
  { id: 'industry', step: 11, question: 'Which industry best describes your work?', type: 'text', field: 'industry', placeholder: 'For example: textiles, food processing, retail', hint: 'This helps us rank relevant schemes.' },
  { id: 'locationType', step: 12, question: 'Where is your business located?', type: 'choice', field: 'locationType', choices: ['Urban', 'Rural'], hint: 'Some subsidies and cluster programmes depend on location.' },
  { id: 'annualIncome', step: 13, question: 'What is your annual personal income?', type: 'number', field: 'annualIncome', placeholder: 'Amount in INR', hint: 'Enter a number, such as 320000.' },
  { id: 'annualTurnover', step: 14, question: 'What is your annual business turnover?', type: 'number', field: 'annualTurnover', placeholder: 'Amount in INR', hint: 'Use 0 if the business has not started.' },
  { id: 'businessInvestment', step: 15, question: 'How much investment do you need?', type: 'number', field: 'businessInvestment', placeholder: 'Amount in INR', hint: 'This powers the subsidy and loan estimates.' },
  { id: 'employeeCount', step: 16, question: 'How many people work in the business?', type: 'number', field: 'employeeCount', placeholder: 'Number of employees', hint: 'Include yourself if you are the only worker.' },
  { id: 'yearsInOperation', step: 17, question: 'How many years have you operated?', type: 'number', field: 'yearsInOperation', placeholder: 'Years', hint: 'Use 0 for an idea-stage business.' },
  { id: 'udyamRegistered', step: 18, question: 'Do you have Udyam Registration?', type: 'choice', field: 'udyamRegistered', choices: ['Yes', 'No'], hint: 'This registration unlocks several MSME schemes.' },
  { id: 'gstRegistered', step: 19, question: 'Is your business GST registered?', type: 'choice', field: 'gstRegistered', choices: ['Yes', 'No'], hint: 'Answer based on your current registration status.' },
  { id: 'isArtisan', step: 20, question: 'Are you an artisan, weaver, or traditional industry worker?', type: 'choice', field: 'isArtisan', choices: ['Yes', 'No'], hint: 'This determines access to artisan and handloom programmes.' },
];

export default function Onboarding({ onNavigate }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textValue, setTextValue] = useState('');

  const step = STEPS[currentStep];
  const progress = ((currentStep) / STEPS.length) * 100;
  const isLast = currentStep === STEPS.length - 1;

  const persistAnswers = (values: Record<string, string>) => {
    const numericFields = ['age', 'annualIncome', 'annualTurnover', 'businessInvestment', 'employeeCount', 'yearsInOperation'];
    const profile = { ...EMPTY_PROFILE, ...values } as Record<string, unknown>;
    for (const field of numericFields) profile[field] = Number(values[field] || 0);
    for (const field of ['udyamRegistered', 'gstRegistered', 'isArtisan']) profile[field] = values[field] === 'Yes';
    profile.entrepreneurCategory = values.entrepreneurCategory?.replace(' Entrepreneur', '').replace(/^SC \(.+\)$/, 'SC').replace(/^ST \(.+\)$/, 'ST') || '';
    profile.needs = values.needs ? [values.needs.split(' / ')[0]] : [];
    saveProfile(profile).then(saved => {
      if (saved) hydrateData({ schemes: SCHEMES, profile: saved });
    }).catch(() => undefined);
  };

  const handleChoice = (choice: string) => {
    const newAnswers = { ...answers, [step.field]: choice };
    setAnswers(newAnswers);
    persistAnswers(newAnswers);
    setTimeout(() => {
      if (!isLast) {
        setCurrentStep(c => c + 1);
        setTextValue('');
      } else {
        persistAnswers(newAnswers);
        onNavigate('dashboard');
      }
    }, 200);
  };

  const handleTextNext = () => {
    if (!textValue.trim()) return;
    const newAnswers = { ...answers, [step.field]: textValue };
    setAnswers(newAnswers);
    persistAnswers(newAnswers);
    if (!isLast) {
      setCurrentStep(c => c + 1);
      setTextValue('');
    } else {
      persistAnswers(newAnswers);
      onNavigate('dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(c => c - 1);
      setTextValue(answers[STEPS[currentStep - 1].field] || '');
    } else {
      onNavigate('landing');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF7F0', fontFamily: 'Inter, sans-serif' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid #E5E0D8', backgroundColor: '#fff' }}>
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <span style={{ fontFamily: 'Fraunces, serif', color: '#1E3A5F', fontWeight: 600 }}>
            Scheme<span style={{ color: '#E8A33D' }}>X</span>
          </span>
          <span className="text-sm" style={{ color: '#7A8B99' }}>Step {currentStep + 1} of {STEPS.length}</span>
        </div>
        {/* Progress bar */}
        <div style={{ height: '3px', backgroundColor: '#E5E0D8' }}>
          <div
            style={{ height: '100%', backgroundColor: '#E8A33D', width: `${progress}%`, transition: 'width 0.3s ease' }}
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-label={`Step ${currentStep + 1} of ${STEPS.length}`}
          />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div
            key={step.id}
            style={{ animation: 'fadeIn 0.25s ease' }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#E8A33D' }}>
              {currentStep + 1} / {STEPS.length}
            </div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: '#1E3A5F', fontWeight: 500, marginBottom: '0.5rem', lineHeight: 1.2 }}>
              {step.question}
            </h1>
            {step.hint && (
              <p className="text-sm mb-6 leading-relaxed" style={{ color: '#7A8B99' }}>{step.hint}</p>
            )}

            {step.type === 'text' || step.type === 'number' ? (
              <div className="space-y-4">
                <input
                  type={step.type}
                  value={textValue}
                  onChange={e => setTextValue(e.target.value)}
                  placeholder={step.placeholder}
                  autoFocus
                  className="w-full px-4 py-3.5 text-lg rounded-xl"
                  style={{ border: '2px solid #E5E0D8', backgroundColor: '#fff', color: '#2D2A26', outline: 'none' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1E3A5F')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E5E0D8')}
                  onKeyDown={e => e.key === 'Enter' && handleTextNext()}
                  aria-label={step.question}
                />
                <button
                  onClick={handleTextNext}
                  disabled={!textValue.trim()}
                  className="w-full py-3.5 text-sm font-semibold rounded-xl transition-all"
                  style={{
                    backgroundColor: textValue.trim() ? '#1E3A5F' : '#E5E0D8',
                    color: textValue.trim() ? '#FAF7F0' : '#7A8B99',
                    cursor: textValue.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isLast ? 'Find My Schemes →' : 'Continue →'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {step.choices?.map(choice => (
                  <button
                    key={choice}
                    onClick={() => handleChoice(choice)}
                    className="w-full px-4 py-3.5 text-left text-sm font-medium rounded-xl transition-all"
                    style={{
                      backgroundColor: answers[step.field] === choice ? '#1E3A5F' : '#fff',
                      color: answers[step.field] === choice ? '#FAF7F0' : '#2D2A26',
                      border: `1.5px solid ${answers[step.field] === choice ? '#1E3A5F' : '#E5E0D8'}`,
                    }}
                    onMouseEnter={e => {
                      if (answers[step.field] !== choice) {
                        e.currentTarget.style.borderColor = '#1E3A5F';
                        e.currentTarget.style.backgroundColor = '#1E3A5F0A';
                      }
                    }}
                    onMouseLeave={e => {
                      if (answers[step.field] !== choice) {
                        e.currentTarget.style.borderColor = '#E5E0D8';
                        e.currentTarget.style.backgroundColor = '#fff';
                      }
                    }}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="text-sm font-medium transition-colors"
              style={{ color: '#7A8B99' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1E3A5F')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7A8B99')}
            >
              ← Back
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-sm" style={{ color: '#7A8B99' }}>
              Skip to Dashboard
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

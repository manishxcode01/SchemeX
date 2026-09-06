import { useState } from 'react';
import { SCHEMES, USER_PROFILE, checkEligibility, calculateBenefit, formatINR } from '../data/schemes';

interface Props {
  schemeId: string;
  onNavigate: (page: string, id?: string) => void;
}

export default function SchemeDetail({ schemeId, onNavigate }: Props) {
  const scheme = SCHEMES.find(s => s.id === schemeId) || SCHEMES[0];
  const eligibility = checkEligibility(scheme, USER_PROFILE);
  const calc = scheme.calculator;

  const [inputs, setInputs] = useState<Record<string, number>>(() => {
    if (!calc) return {};
    const defaults: Record<string, number> = {};
    calc.inputs.forEach(inp => {
      if (inp.profileKey && (USER_PROFILE as any)[inp.profileKey]) {
        defaults[inp.key] = (USER_PROFILE as any)[inp.profileKey];
      } else {
        defaults[inp.key] = inp.min || 0;
      }
    });
    return defaults;
  });

  const [calculated, setCalculated] = useState(false);
  const [calcResult, setCalcResult] = useState<ReturnType<typeof calculateBenefit> | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isEligible = eligibility.status === 'ELIGIBLE';
  const isNearMiss = eligibility.status === 'NEAR_MISS';
  const userDocuments = USER_PROFILE.documents || [];
  const requiredDocuments = scheme.documents.filter(document => document.required);
  const missingDocuments = requiredDocuments.filter(document => !userDocuments.includes(document.name));

  const handleCalculate = () => {
    const result = calculateBenefit(scheme, inputs);
    setCalcResult(result);
    setCalculated(true);
  };

  const handleListen = () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = `${scheme.name}. ${scheme.description}. Benefits: ${scheme.benefits}`;
    const utt = new SpeechSynthesisUtterance(text);
    utt.onend = () => setIsSpeaking(false);
    window.speechSynthesis?.speak(utt);
    setIsSpeaking(true);
  };

  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const eligibilityColor = isEligible ? '#1E6B3C' : isNearMiss ? '#C7511F' : '#7A8B99';
  const eligibilityBg = isEligible ? '#1E6B3C11' : isNearMiss ? '#C7511F11' : '#7A8B9911';
  const eligibilityLabel = isEligible ? '✓ You appear eligible' : isNearMiss ? '⚠ Almost eligible' : '✗ Not matched';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F0', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #E5E0D8', backgroundColor: '#fff' }} className="sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-2 text-sm">
          <button onClick={() => onNavigate('landing')} style={{ color: '#7A8B99' }}>SchemeX</button>
          <span style={{ color: '#E5E0D8' }}>›</span>
          <button onClick={() => onNavigate('schemes')} style={{ color: '#7A8B99' }}>Schemes</button>
          <span style={{ color: '#E5E0D8' }}>›</span>
          <span style={{ color: '#2D2A26' }} className="truncate max-w-xs">{scheme.name}</span>
          <button onClick={() => handleListen()}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
            style={{ backgroundColor: isSpeaking ? '#1E3A5F' : '#FAF7F0', color: isSpeaking ? '#FAF7F0' : '#1E3A5F', border: '1px solid #1E3A5F' }}
            aria-label={isSpeaking ? 'Stop listening' : 'Listen to scheme summary'}>
            🔊 {isSpeaking ? 'Stop' : 'Listen'}
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: main info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: eligibilityBg, color: eligibilityColor }}>
                  {eligibilityLabel}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1E3A5F11', color: '#1E3A5F' }}>
                  {scheme.category.replace('_', ' ')}
                </span>
              </div>
              <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.9rem', color: '#1E3A5F', fontWeight: 500, lineHeight: 1.2 }}>
                {scheme.name}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-sm" style={{ color: '#7A8B99' }}>
                <span>{scheme.department}</span>
                <span>·</span>
                <span>Last verified {scheme.lastVerified}</span>
              </div>
            </div>

            {/* Official info label */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3 pb-2"
                style={{ color: '#7A8B99', borderBottom: '1px solid #E5E0D8' }}>
                Official Scheme Information
              </div>
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-semibold mb-2" style={{ color: '#2D2A26' }}>About this Scheme</h2>
                  <p className="text-sm leading-relaxed" style={{ color: '#7A8B99' }}>{scheme.description}</p>
                </div>
                <div>
                  <h2 className="text-sm font-semibold mb-2" style={{ color: '#2D2A26' }}>Benefits</h2>
                  <p className="text-sm leading-relaxed" style={{ color: '#7A8B99' }}>{scheme.benefits}</p>
                </div>
                <div>
                  <h2 className="text-sm font-semibold mb-2" style={{ color: '#2D2A26' }}>Eligibility Criteria</h2>
                  <p className="text-sm leading-relaxed" style={{ color: '#7A8B99' }}>{scheme.eligibilityText}</p>
                </div>
              </div>
            </div>

            {/* SchemeX explanation */}
            <div className="p-5 rounded-xl" style={{ backgroundColor: '#1E3A5F0A', border: '1px solid #1E3A5F22' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#1E3A5F' }}>
                SchemeX Explanation — Why this matches your profile
              </div>
              <div className="space-y-2">
                {eligibility.satisfied.map(req => (
                  <div key={req} className="flex items-start gap-2 text-sm">
                    <span style={{ color: '#1E6B3C', marginTop: '0.1rem' }}>✓</span>
                    <span style={{ color: '#2D2A26' }}>{req}</span>
                  </div>
                ))}
                {eligibility.missing.map(req => (
                  <div key={req} className="flex items-start gap-2 text-sm">
                    <span style={{ color: '#C7511F', marginTop: '0.1rem' }}>○</span>
                    <span style={{ color: '#C7511F' }}>{req}</span>
                  </div>
                ))}
                {eligibility.failed.map(req => (
                  <div key={req} className="flex items-start gap-2 text-sm">
                    <span style={{ color: '#7A8B99', marginTop: '0.1rem' }}>✗</span>
                    <span style={{ color: '#7A8B99' }}>{req}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs" style={{ color: '#7A8B99' }}>
                Match score: <strong style={{ color: '#1E3A5F' }}>{eligibility.matchScore}%</strong> based on your profile.
                Final eligibility is determined by the official authority.
              </div>
            </div>

            {/* Near-miss guidance */}
            {isNearMiss && eligibility.missing.length > 0 && (
              <div className="p-5 rounded-xl" style={{ backgroundColor: '#C7511F0A', border: '1.5px solid #C7511F33' }}>
                <div className="font-semibold mb-1" style={{ color: '#C7511F' }}>You're close — here's what to do</div>
                <p className="text-sm mb-3" style={{ color: '#7A8B99' }}>
                  You meet {eligibility.satisfied.length} of {eligibility.satisfied.length + eligibility.missing.length} key requirements.
                  Completing the following will unlock this scheme:
                </p>
                {eligibility.missing.map(req => (
                  <div key={req} className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#fff' }}>
                    <div className="font-semibold text-sm mb-1" style={{ color: '#C7511F' }}>{req}</div>
                    {req.includes('Udyam') && (
                      <>
                        <p className="text-xs mb-2" style={{ color: '#7A8B99' }}>
                          Free registration for micro, small, and medium enterprises. Takes about 10–15 minutes online.
                        </p>
                        <a href="https://udyamregistration.gov.in" target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold" style={{ color: '#1E3A5F' }}>
                          Register on Udyamregistration.gov.in →
                        </a>
                      </>
                    )}
                    {req.includes('GST') && (
                      <>
                        <p className="text-xs mb-2" style={{ color: '#7A8B99' }}>
                          GST registration is required for taxable supply of goods or services above threshold.
                        </p>
                        <a href="https://www.gst.gov.in" target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold" style={{ color: '#1E3A5F' }}>
                          Register on GST.gov.in →
                        </a>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Application process */}
            <div>
              <h2 className="font-semibold mb-4" style={{ color: '#2D2A26' }}>How to Apply</h2>
              <ol className="space-y-3">
                {scheme.applicationProcess.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#7A8B99' }}>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5"
                      style={{ backgroundColor: '#1E3A5F11', color: '#1E3A5F' }}>
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Documents */}
            <div>
              <h2 className="font-semibold mb-4" style={{ color: '#2D2A26' }}>Required Documents</h2>
              <div className="space-y-2">
                {scheme.documents.map(doc => (
                  <div key={doc.name} className="flex items-center gap-3 text-sm py-2"
                    style={{ borderBottom: '1px solid #E5E0D8' }}>
                    <span aria-hidden="true">{userDocuments.includes(doc.name) ? '✓' : doc.required ? '○' : '◌'}</span>
                    <span style={{ color: userDocuments.includes(doc.name) ? '#1E6B3C' : '#2D2A26' }}>{doc.name}</span>
                    {!doc.required && <span className="ml-auto text-xs" style={{ color: '#7A8B99' }}>Optional</span>}
                    {doc.required && !userDocuments.includes(doc.name) && <span className="ml-auto text-xs" style={{ color: '#C7511F' }}>Missing</span>}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs" style={{ color: '#7A8B99' }}>{missingDocuments.length ? `${missingDocuments.length} required document${missingDocuments.length === 1 ? '' : 's'} missing from your profile.` : 'You have all required documents marked for this scheme.'}</p>
            </div>

            {/* Official link */}
            <div className="pt-2">
              <a href={scheme.officialUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-md transition-colors"
                style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}>
                Apply on Official Website ↗
              </a>
              <p className="mt-2 text-xs" style={{ color: '#7A8B99' }}>
                SchemeX guides you. The official portal processes your application.
              </p>
            </div>
          </div>

          {/* Right: Calculator */}
          <aside aria-labelledby="calc-heading">
            <div className="sticky top-20 space-y-5">
              {calc?.enabled ? (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D8' }}>
                  <div className="p-5" style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}>
                    <h2 id="calc-heading" style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 500 }}>
                      {calc.title}
                    </h2>
                    <p className="text-xs mt-1" style={{ color: '#7A8B9999' }}>
                      Based on your profile · Estimates only
                    </p>
                  </div>

                  {!isEligible && !isNearMiss ? (
                    <div className="p-5 text-sm" style={{ color: '#7A8B99', backgroundColor: '#fff' }}>
                      This calculator is unavailable because you currently don't meet the mandatory eligibility requirements.
                    </div>
                  ) : (
                    <div className="p-5 space-y-4" style={{ backgroundColor: '#fff' }}>
                      {isNearMiss && (
                        <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: '#C7511F0A', color: '#C7511F' }}>
                          ⚠ Estimate shown. Available in full after you meet the missing eligibility requirement.
                        </div>
                      )}

                      {calc.inputs.map(inp => (
                        <div key={inp.key}>
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2D2A26' }}>
                            {inp.label}
                            {inp.profileKey && (USER_PROFILE as any)[inp.profileKey] && (
                              <span className="ml-2 font-normal" style={{ color: '#1E6B3C' }}>✓ From your profile</span>
                            )}
                          </label>
                          <div className="relative">
                            {inp.type === 'currency' && (
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#7A8B99' }}>₹</span>
                            )}
                            <input
                              type="number"
                              value={inputs[inp.key] || ''}
                              onChange={e => setInputs(prev => ({ ...prev, [inp.key]: parseFloat(e.target.value) || 0 }))}
                              className="w-full py-2.5 rounded-lg text-sm"
                              style={{
                                paddingLeft: inp.type === 'currency' ? '1.75rem' : '0.75rem',
                                paddingRight: '0.75rem',
                                border: '1.5px solid #E5E0D8',
                                color: '#2D2A26',
                                outline: 'none',
                              }}
                              min={inp.min}
                              max={inp.max}
                              aria-label={inp.label}
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={handleCalculate}
                        className="w-full py-3 text-sm font-semibold rounded-lg transition-all"
                        style={{ backgroundColor: '#E8A33D', color: '#2D2A26' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#d4922e')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#E8A33D')}
                      >
                        Calculate Benefit
                      </button>

                      {calculated && calcResult && calcResult.result > 0 && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg" style={{ backgroundColor: '#E8A33D11', border: '1px solid #E8A33D44' }}>
                            <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#7A8B99' }}>
                              Estimated Benefit
                            </div>
                            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 600, color: '#1E3A5F' }}>
                              {formatINR(calcResult.result)}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#7A8B99' }}>
                              Calculation Breakdown
                            </div>
                            <div className="space-y-2">
                              {calcResult.breakdown.map(row => (
                                <div key={row.label} className="flex justify-between text-xs">
                                  <span style={{ color: '#7A8B99' }}>{row.label}</span>
                                  <span style={{ color: '#2D2A26', fontWeight: 500 }}>{row.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {calcResult.formula && (
                            <div className="p-3 rounded-lg" style={{ backgroundColor: '#FAF7F0' }}>
                              <div className="text-xs font-semibold mb-1" style={{ color: '#7A8B99' }}>How we calculated this</div>
                              <div className="text-xs" style={{ color: '#2D2A26' }}>{calcResult.formula}</div>
                            </div>
                          )}

                          {calcResult.warnings.map(w => (
                            <div key={w} className="text-xs p-2 rounded-lg" style={{ backgroundColor: '#E8A33D11', color: '#C7511F' }}>
                              ℹ {w}
                            </div>
                          ))}

                          <p className="text-xs leading-relaxed" style={{ color: '#7A8B99' }}>
                            Actual benefits depend on official verification, scheme conditions, eligible costs, and final approval.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 rounded-xl text-sm" style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8', color: '#7A8B99' }}>
                  No calculator is configured for this scheme. Refer to the official website for benefit details.
                </div>
              )}

              {/* Ask SchemeX */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: '#1E3A5F0A', border: '1px solid #1E3A5F22' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: '#1E3A5F' }}>Have a question?</div>
                <button onClick={() => onNavigate('assistant')}
                  className="w-full flex items-center gap-2 text-sm font-medium py-2 justify-center rounded-lg transition-colors"
                  style={{ backgroundColor: '#1E3A5F', color: '#FAF7F0' }}>
                  🎤 Ask SchemeX
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

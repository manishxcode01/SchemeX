import { useEffect, useState } from 'react';
import { SCHEMES, USER_PROFILE, checkEligibility, calculateBenefit, formatINR, Scheme, type BenefitCalculation } from '../data/schemes';

interface Props {
  schemeId: string;
  onNavigate: (page: string, id?: string) => void;
}

function computeSchemeDefaults(scheme: Scheme, variantIdx = 0): Record<string, number> {
  const calc = scheme.calculator;
  if (!calc) return {};
  const activeVariant = (calc.variants && calc.variants[variantIdx]) ? { ...calc, ...calc.variants[variantIdx] } : calc;

  const defaults: Record<string, number> = {
    variantIndex: variantIdx,
    isRural: USER_PROFILE.locationType === 'Urban' ? 0 : 1,
    isSpecial: (USER_PROFILE.gender === 'Female' || ['SC', 'ST', 'OBC', 'Women', 'Differently Abled', 'Ex-Serviceman'].includes(USER_PROFILE.entrepreneurCategory)) ? 1 : 0,
    tenureMonths: activeVariant.maxTenureMonths || 60,
  };

  const preferredCost = USER_PROFILE.businessInvestment > 0 ? USER_PROFILE.businessInvestment : (activeVariant.minProjectCost || 100000);
  defaults['projectCost'] = Math.max(activeVariant.minProjectCost || 10000, Math.min(activeVariant.maxProjectCost || 10000000, preferredCost));

  calc.inputs.forEach((inp) => {
    if (inp.key === 'isRural') {
      defaults[inp.key] = USER_PROFILE.locationType === 'Urban' ? 0 : 1;
    } else if (inp.key === 'monthlyRevenue') {
      defaults[inp.key] = USER_PROFILE.annualTurnover ? Math.round(USER_PROFILE.annualTurnover / 12) : 25000;
    } else if (inp.key === 'businessAge') {
      defaults[inp.key] = (USER_PROFILE.yearsInOperation || 1) * 12;
    } else if (inp.key === 'loanPeriod') {
      defaults[inp.key] = 3;
    } else if (inp.key === 'projectCost' || inp.key === 'loanAmount') {
      defaults[inp.key] = Math.max(activeVariant.minProjectCost || inp.min || 10000, Math.min(activeVariant.maxProjectCost || inp.max || 10000000, preferredCost));
    } else if (inp.profileKey && (USER_PROFILE as any)[inp.profileKey]) {
      const val = Number((USER_PROFILE as any)[inp.profileKey]);
      defaults[inp.key] = val > 0 ? val : (inp.min || 0);
    } else if (defaults[inp.key] === undefined) {
      defaults[inp.key] = inp.min || 0;
    }
  });
  return defaults;
}

export default function SchemeDetail({ schemeId, onNavigate }: Props) {
  const scheme = SCHEMES.find(s => s.id === schemeId) || SCHEMES[0];
  const eligibility = checkEligibility(scheme, USER_PROFILE);
  const calc = scheme.calculator;

  const [selectedVariant, setSelectedVariant] = useState(0);
  const [inputs, setInputs] = useState<Record<string, number>>(() => computeSchemeDefaults(scheme, 0));
  const [calculated, setCalculated] = useState(true);
  const [calcResult, setCalcResult] = useState<BenefitCalculation | null>(() => {
    if (!calc?.enabled) return null;
    return calculateBenefit(scheme, computeSchemeDefaults(scheme, 0), USER_PROFILE);
  });

  const [simulatedDocuments, setSimulatedDocuments] = useState<string[]>(USER_PROFILE.documents || []);

  useEffect(() => {
    const defaults = computeSchemeDefaults(scheme, 0);
    setSelectedVariant(0);
    setInputs(defaults);
    setSimulatedDocuments(USER_PROFILE.documents || []);
    if (scheme.calculator?.enabled) {
      setCalcResult(calculateBenefit(scheme, defaults, USER_PROFILE));
      setCalculated(true);
    } else {
      setCalcResult(null);
      setCalculated(false);
    }
  }, [schemeId, scheme]);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const isEligible = eligibility.status === 'ELIGIBLE';
  const isNearMiss = eligibility.status === 'NEAR_MISS';
  const requiredDocuments = scheme.documents.filter(document => document.required);
  const missingDocuments = requiredDocuments.filter(document => !simulatedDocuments.includes(document.name));

  const handleVariantChange = (idx: number) => {
    setSelectedVariant(idx);
    const defaults = computeSchemeDefaults(scheme, idx);
    const updated = { ...inputs, ...defaults, variantIndex: idx };
    setInputs(updated);
    if (calc?.enabled) {
      setCalcResult(calculateBenefit(scheme, updated, USER_PROFILE));
      setCalculated(true);
    }
  };

  const handleInputChange = (key: string, rawVal: number) => {
    setInputs(prev => {
      const updated = { ...prev, [key]: rawVal, variantIndex: selectedVariant };
      if (calc?.enabled) {
        setCalcResult(calculateBenefit(scheme, updated, USER_PROFILE));
        setCalculated(true);
      }
      return updated;
    });
  };

  const handleCalculate = () => {
    const result = calculateBenefit(scheme, { ...inputs, variantIndex: selectedVariant }, USER_PROFILE);
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

  const toggleDocument = (docName: string) => {
    setSimulatedDocuments(prev =>
      prev.includes(docName) ? prev.filter(d => d !== docName) : [...prev, docName]
    );
  };

  const eligibilityColor = isEligible ? '#1E6B3C' : isNearMiss ? '#C7511F' : '#7A8B99';
  const eligibilityBg = isEligible ? '#1E6B3C11' : isNearMiss ? '#C7511F11' : '#7A8B9911';
  const eligibilityLabel = isEligible ? '✓ Fully Eligible' : isNearMiss ? '⚠ Almost Eligible (Actionable)' : '○ Exploratory Mode';

  const activeVariantConfig = (calc?.variants && calc.variants[selectedVariant])
    ? { ...calc, ...calc.variants[selectedVariant] }
    : calc;

  const metrics = calcResult?.metrics;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F0', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Breadcrumb Nav */}
      <nav style={{ borderBottom: '1px solid #E5E0D8', backgroundColor: '#fff' }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-2 text-sm">
          <button onClick={() => onNavigate('landing')} style={{ color: '#7A8B99' }}>SchemeX</button>
          <span style={{ color: '#E5E0D8' }}>›</span>
          <button onClick={() => onNavigate('schemes')} style={{ color: '#7A8B99' }}>Schemes</button>
          <span style={{ color: '#E5E0D8' }}>›</span>
          <span style={{ color: '#2D2A26' }} className="truncate max-w-sm font-medium">{scheme.name}</span>
          <button
            onClick={handleListen}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
            style={{ backgroundColor: isSpeaking ? '#1E3A5F' : '#FAF7F0', color: isSpeaking ? '#FAF7F0' : '#1E3A5F', border: '1px solid #1E3A5F' }}
            aria-label={isSpeaking ? 'Stop listening' : 'Listen to scheme summary'}
          >
            🔊 {isSpeaking ? 'Stop Audio' : 'Listen Summary'}
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Scheme Information & Guidance (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Header Title Section */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: eligibilityBg, color: eligibilityColor }}>
                  {eligibilityLabel}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: '#1E3A5F11', color: '#1E3A5F' }}>
                  {scheme.category.toUpperCase()}
                </span>
                {scheme.sourceSchemeId && (
                  <span className="text-xs px-2 py-0.5 rounded text-gray-500 bg-gray-100 font-mono">
                    {scheme.sourceSchemeId}
                  </span>
                )}
              </div>

              <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2.1rem', color: '#1E3A5F', fontWeight: 600, lineHeight: 1.15 }}>
                {scheme.name}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs" style={{ color: '#7A8B99' }}>
                <span className="font-semibold" style={{ color: '#2D2A26' }}>{scheme.department}</span>
                {scheme.implementingAgency && (
                  <span>· Agency: <strong style={{ color: '#1E3A5F' }}>{scheme.implementingAgency}</strong></span>
                )}
                <span>· Last verified: {scheme.lastVerified}</span>
              </div>
            </div>

            {/* Official Scheme Information */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E0D8] space-y-5">
              <div className="text-xs font-semibold uppercase tracking-wider pb-2 border-b border-[#E5E0D8]" style={{ color: '#7A8B99' }}>
                Official Scheme Specifications
              </div>
              <div>
                <h2 className="text-sm font-semibold mb-1.5" style={{ color: '#1E3A5F' }}>About this Scheme</h2>
                <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>{scheme.description}</p>
              </div>
              <div>
                <h2 className="text-sm font-semibold mb-1.5" style={{ color: '#1E3A5F' }}>Key Financial Benefits</h2>
                <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>{scheme.benefits}</p>
              </div>
              <div>
                <h2 className="text-sm font-semibold mb-1.5" style={{ color: '#1E3A5F' }}>Mandatory Eligibility Criteria</h2>
                <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>{scheme.eligibilityText}</p>
              </div>
            </div>

            {/* ACTIONABLE DECISION GUIDANCE: Disqualifiers & Remediation */}
            {(scheme.disqualifiers || scheme.remediationGuidance) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {scheme.disqualifiers && (
                  <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/60">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 mb-2">
                      <span>⚠️</span> Common Disqualifiers
                    </div>
                    <p className="text-xs leading-relaxed text-amber-950">{scheme.disqualifiers}</p>
                  </div>
                )}
                {scheme.remediationGuidance && (
                  <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/60">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2">
                      <span>💡</span> Actionable Remediation
                    </div>
                    <p className="text-xs leading-relaxed text-emerald-950">{scheme.remediationGuidance}</p>
                  </div>
                )}
              </div>
            )}

            {/* SchemeX Eligibility Gap Breakdown */}
            <div className="p-6 rounded-2xl border" style={{ backgroundColor: '#1E3A5F08', borderColor: '#1E3A5F22' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#1E3A5F' }}>
                  Eligibility Gap Analysis
                </div>
                <div className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#1E3A5F15', color: '#1E3A5F' }}>
                  Match Score: {eligibility.matchScore}%
                </div>
              </div>
              <div className="space-y-2.5">
                {eligibility.satisfied.map(req => (
                  <div key={req} className="flex items-start gap-2.5 text-sm">
                    <span className="font-bold shrink-0 mt-0.5" style={{ color: '#1E6B3C' }}>✓</span>
                    <span style={{ color: '#2D2A26' }}>{req}</span>
                  </div>
                ))}
                {eligibility.missing.map(req => (
                  <div key={req} className="flex items-start gap-2.5 text-sm">
                    <span className="font-bold shrink-0 mt-0.5" style={{ color: '#C7511F' }}>○</span>
                    <span style={{ color: '#C7511F' }}>{req}</span>
                  </div>
                ))}
                {eligibility.failed.map(req => (
                  <div key={req} className="flex items-start gap-2.5 text-sm">
                    <span className="font-bold shrink-0 mt-0.5" style={{ color: '#9CA3AF' }}>✕</span>
                    <span style={{ color: '#6B7280' }}>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Next Steps to Unlock Scheme */}
            {isNearMiss && eligibility.missing.length > 0 && (
              <div className="p-6 rounded-2xl border border-[#C7511F33] bg-[#C7511F08]">
                <div className="font-semibold text-sm mb-1" style={{ color: '#C7511F' }}>
                  You are close — Steps to unlock full approval:
                </div>
                <p className="text-xs mb-4" style={{ color: '#7A8B99' }}>
                  You meet {eligibility.satisfied.length} requirements. Resolve the following items to become fully eligible:
                </p>
                <div className="space-y-3">
                  {eligibility.missing.map(req => (
                    <div key={req} className="p-3.5 rounded-xl bg-white border border-[#E5E0D8]">
                      <div className="font-semibold text-xs mb-1" style={{ color: '#C7511F' }}>{req}</div>
                      {req.toLowerCase().includes('udyam') && (
                        <div className="text-xs text-[#7A8B99] flex items-center justify-between mt-1">
                          <span>Free 10-minute online registration for MSMEs.</span>
                          <a href="https://udyamregistration.gov.in" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1E3A5F] hover:underline">
                            Register on Udyam ↗
                          </a>
                        </div>
                      )}
                      {req.toLowerCase().includes('gst') && (
                        <div className="text-xs text-[#7A8B99] flex items-center justify-between mt-1">
                          <span>Required for formal taxable trading or manufacturing.</span>
                          <a href="https://www.gst.gov.in" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1E3A5F] hover:underline">
                            GST Portal ↗
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How to Apply (Step-by-Step) */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E0D8]">
              <h2 className="font-semibold text-sm mb-4" style={{ color: '#1E3A5F' }}>How to Apply Step-by-Step</h2>
              <ol className="space-y-3">
                {scheme.applicationProcess.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#4B5563]">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 bg-[#1E3A5F15] text-[#1E3A5F]">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Documents Checklist with Interactive Toggles */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E0D8]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm" style={{ color: '#1E3A5F' }}>Required Documents Checklist</h2>
                <span className="text-xs text-[#7A8B99]">Click to mark what you have</span>
              </div>
              <div className="space-y-2.5">
                {scheme.documents.map(doc => {
                  const hasDoc = simulatedDocuments.includes(doc.name);
                  return (
                    <button
                      key={doc.name}
                      type="button"
                      onClick={() => toggleDocument(doc.name)}
                      className="w-full flex items-center justify-between text-sm py-2 px-3 rounded-lg border text-left transition-colors hover:bg-gray-50"
                      style={{ borderColor: hasDoc ? '#1E6B3C44' : '#E5E0D8', backgroundColor: hasDoc ? '#1E6B3C08' : '#fff' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-base" style={{ color: hasDoc ? '#1E6B3C' : '#9CA3AF' }}>
                          {hasDoc ? '✓' : '○'}
                        </span>
                        <span style={{ color: hasDoc ? '#1E6B3C' : '#2D2A26', fontWeight: hasDoc ? 500 : 400 }}>
                          {doc.name}
                        </span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{
                        backgroundColor: hasDoc ? '#1E6B3C15' : doc.required ? '#C7511F15' : '#F3F4F6',
                        color: hasDoc ? '#1E6B3C' : doc.required ? '#C7511F' : '#6B7280',
                      }}>
                        {hasDoc ? 'Present' : doc.required ? 'Mandatory' : 'Optional'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-[#7A8B99]">
                {missingDocuments.length
                  ? `${missingDocuments.length} mandatory document${missingDocuments.length === 1 ? '' : 's'} missing from your checklist.`
                  : '✓ All mandatory documents are marked ready for application.'}
              </p>
            </div>

            {/* Official Portal Link */}
            <div className="pt-2">
              <a
                href={scheme.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-xl text-white transition-all shadow-md hover:shadow-lg"
                style={{ backgroundColor: '#1E3A5F' }}
              >
                Apply on Official Website ↗
              </a>
              <p className="mt-2 text-xs text-[#7A8B99]">
                SchemeX provides eligibility guidance and financial estimates. Applications are submitted directly to the verified official government portal.
              </p>
            </div>
          </div>

          {/* Right: DYNAMIC ACTIONABLE CALCULATOR (5 cols) */}
          <aside className="lg:col-span-5" aria-labelledby="calc-heading">
            <div className="sticky top-20 space-y-6">
              {calc?.enabled ? (
                <div className="rounded-2xl overflow-hidden shadow-lg border border-[#E5E0D8] bg-white">
                  
                  {/* Header */}
                  <div className="p-5 text-white" style={{ backgroundColor: '#1E3A5F' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#E8A33D]">
                        Dynamic Financial Model
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium">
                        Live Estimator
                      </span>
                    </div>
                    <h2 id="calc-heading" style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600 }}>
                      {calc.title}
                    </h2>
                    <p className="text-xs mt-1 text-gray-300">
                      Model your project cost, subsidy grant, bank loan, and monthly EMI.
                    </p>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Status Badge */}
                    <div className="p-3 rounded-xl text-xs flex items-center justify-between" style={{
                      backgroundColor: isEligible ? '#1E6B3C10' : '#E8A33D15',
                      color: isEligible ? '#1E6B3C' : '#92400E',
                      border: isEligible ? '1px solid #1E6B3C33' : '1px solid #E8A33D44',
                    }}>
                      <span>
                        {isEligible
                          ? '✓ Fully eligible based on your profile'
                          : isNearMiss
                          ? '⚠ Showing estimate. Unlock by meeting missing requirements.'
                          : '✦ Interactive preview mode for planning.'}
                      </span>
                    </div>

                    {/* Variant Selector (e.g. PMEGP Mfg vs Services, Mudra Shishu/Kishore/Tarun) */}
                    {calc.variants && calc.variants.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 text-[#2D2A26]">
                          Scheme Variant / Category
                        </label>
                        <div className="grid grid-cols-1 gap-1.5">
                          {calc.variants.map((v, idx) => (
                            <button
                              key={v.label}
                              type="button"
                              onClick={() => handleVariantChange(idx)}
                              className="text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all"
                              style={{
                                borderColor: selectedVariant === idx ? '#1E3A5F' : '#E5E0D8',
                                backgroundColor: selectedVariant === idx ? '#1E3A5F10' : '#fff',
                                color: selectedVariant === idx ? '#1E3A5F' : '#4B5563',
                                fontWeight: selectedVariant === idx ? 600 : 400,
                              }}
                            >
                              {v.label} (Up to {formatINR(v.maxProjectCost)})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Project Cost Slider & Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-[#2D2A26]">
                          Total Project / Investment Cost
                        </label>
                        <span className="text-xs font-bold text-[#1E3A5F]">
                          {formatINR(inputs['projectCost'] || activeVariantConfig?.minProjectCost || 100000)}
                        </span>
                      </div>
                      <div className="relative mb-2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₹</span>
                        <input
                          type="number"
                          value={inputs['projectCost'] ?? (activeVariantConfig?.minProjectCost || 100000)}
                          onChange={e => handleInputChange('projectCost', Number(e.target.value) || 0)}
                          min={activeVariantConfig?.minProjectCost || 10000}
                          max={activeVariantConfig?.maxProjectCost || 10000000}
                          step={10000}
                          className="w-full pl-7 pr-3 py-2.5 rounded-lg text-sm border border-[#E5E0D8] font-medium text-[#1E3A5F] focus:border-[#1E3A5F] outline-none"
                        />
                      </div>
                      <input
                        type="range"
                        value={inputs['projectCost'] ?? (activeVariantConfig?.minProjectCost || 100000)}
                        onChange={e => handleInputChange('projectCost', Number(e.target.value) || 0)}
                        min={activeVariantConfig?.minProjectCost || 10000}
                        max={activeVariantConfig?.maxProjectCost || 10000000}
                        step={10000}
                        className="w-full accent-[#1E3A5F]"
                      />
                      <div className="flex justify-between text-[10px] text-[#7A8B99] mt-0.5">
                        <span>Min: {formatINR(activeVariantConfig?.minProjectCost || 10000)}</span>
                        <span>Max: {formatINR(activeVariantConfig?.maxProjectCost || 10000000)}</span>
                      </div>
                    </div>

                    {/* Interactive Toggles: Rural vs Urban & Special Category */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#2D2A26] mb-1">
                          Enterprise Location
                        </label>
                        <select
                          value={inputs['isRural'] ?? (USER_PROFILE.locationType === 'Urban' ? 0 : 1)}
                          onChange={e => handleInputChange('isRural', Number(e.target.value))}
                          className="w-full text-xs p-2 rounded-lg border border-[#E5E0D8] bg-white font-medium"
                        >
                          <option value={1}>Rural (Higher Subsidy)</option>
                          <option value={0}>Urban</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#2D2A26] mb-1">
                          Promoter Category
                        </label>
                        <select
                          value={inputs['isSpecial'] ?? 1}
                          onChange={e => handleInputChange('isSpecial', Number(e.target.value))}
                          className="w-full text-xs p-2 rounded-lg border border-[#E5E0D8] bg-white font-medium"
                        >
                          <option value={1}>Special (Women / SC / ST / OBC)</option>
                          <option value={0}>General</option>
                        </select>
                      </div>
                    </div>

                    {/* Tenure Slider */}
                    {activeVariantConfig?.maxTenureMonths && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <label className="font-semibold text-[#2D2A26]">Loan Repayment Tenure</label>
                          <span className="font-semibold text-[#1E3A5F]">
                            {inputs['tenureMonths'] || activeVariantConfig.maxTenureMonths} Months ({Math.round((inputs['tenureMonths'] || activeVariantConfig.maxTenureMonths) / 12)} Yrs)
                          </span>
                        </div>
                        <input
                          type="range"
                          value={inputs['tenureMonths'] || activeVariantConfig.maxTenureMonths}
                          onChange={e => handleInputChange('tenureMonths', Number(e.target.value))}
                          min={activeVariantConfig.minTenureMonths || 12}
                          max={activeVariantConfig.maxTenureMonths || 84}
                          step={6}
                          className="w-full accent-[#1E3A5F]"
                        />
                      </div>
                    )}

                    {/* Calculate Button */}
                    <button
                      onClick={handleCalculate}
                      className="w-full py-3 rounded-xl font-semibold text-sm transition-all shadow hover:shadow-md"
                      style={{ backgroundColor: '#E8A33D', color: '#2D2A26' }}
                    >
                      Recalculate Model ✦
                    </button>

                    {/* ACTIONABLE DECISION RESULTS CARDS */}
                    {calculated && calcResult && metrics && (
                      <div className="space-y-4 pt-2">
                        
                        {/* Headline Card */}
                        <div className="p-4 rounded-xl text-center border" style={{
                          backgroundColor: metrics.subsidyAmount > 0 ? '#1E6B3C0D' : '#1E3A5F0D',
                          borderColor: metrics.subsidyAmount > 0 ? '#1E6B3C33' : '#1E3A5F33',
                        }}>
                          <div className="text-xs font-semibold uppercase tracking-wider text-[#7A8B99] mb-0.5">
                            {calcResult.headlineLabel}
                          </div>
                          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '2.1rem', fontWeight: 600, color: metrics.subsidyAmount > 0 ? '#1E6B3C' : '#1E3A5F' }}>
                            {formatINR(calcResult.result)}
                          </div>
                          <div className="text-[11px] text-[#7A8B99] mt-0.5 font-medium">
                            {metrics.subsidyStructure}
                          </div>
                        </div>

                        {/* Actionable Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="p-3 rounded-xl border border-[#E5E0D8] bg-gray-50/70">
                            <div className="text-[10px] uppercase font-semibold text-[#7A8B99]">Your Contribution (Equity)</div>
                            <div className="text-sm font-bold text-[#2D2A26] mt-0.5">
                              {formatINR(metrics.borrowerEquity)}
                            </div>
                            <div className="text-[10px] text-[#7A8B99]">
                              {(metrics.borrowerMarginPct * 100).toFixed(0)}% Margin from pocket
                            </div>
                          </div>

                          <div className="p-3 rounded-xl border border-[#E5E0D8] bg-gray-50/70">
                            <div className="text-[10px] uppercase font-semibold text-[#7A8B99]">Net Bank Loan</div>
                            <div className="text-sm font-bold text-[#1E3A5F] mt-0.5">
                              {formatINR(metrics.netLoan)}
                            </div>
                            <div className="text-[10px] text-[#7A8B99]">
                              Bank credit facility
                            </div>
                          </div>

                          <div className="p-3 rounded-xl border border-[#E5E0D8] bg-gray-50/70">
                            <div className="text-[10px] uppercase font-semibold text-[#7A8B99]">Estimated Monthly EMI</div>
                            <div className="text-sm font-bold text-[#1E6B3C] mt-0.5">
                              ₹{metrics.monthlyEMI.toLocaleString('en-IN')}<span className="text-[10px] font-normal text-[#7A8B99]">/mo</span>
                            </div>
                            <div className="text-[10px] text-[#7A8B99]">
                              @{metrics.effectiveRatePct}% p.a.
                            </div>
                          </div>

                          <div className="p-3 rounded-xl border border-[#E5E0D8] bg-gray-50/70">
                            <div className="text-[10px] uppercase font-semibold text-[#7A8B99]">Working Capital Limit</div>
                            <div className="text-sm font-bold text-[#2D2A26] mt-0.5">
                              {formatINR(metrics.workingCapitalAmount)}
                            </div>
                            <div className="text-[10px] text-[#7A8B99]">
                              For daily operational costs
                            </div>
                          </div>
                        </div>

                        {/* Collateral & Moratorium Badges */}
                        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs space-y-1.5 text-blue-900">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <span>🛡️</span> Collateral Status:
                            <span className="font-normal">{metrics.collateralRequired}</span>
                          </div>
                          {metrics.moratoriumMonths > 0 && (
                            <div className="flex items-center gap-1.5 font-semibold">
                              <span>⏱️</span> Moratorium:
                              <span className="font-normal">{metrics.moratoriumMonths} Months principal repayment holiday</span>
                            </div>
                          )}
                        </div>

                        {/* Detailed Calculation Breakdown */}
                        <div className="border border-[#E5E0D8] rounded-xl p-3.5 space-y-2 bg-white">
                          <div className="text-xs font-semibold uppercase tracking-wider text-[#7A8B99] pb-1 border-b border-[#E5E0D8]">
                            Financial Breakdown Summary
                          </div>
                          <div className="space-y-1.5">
                            {calcResult.breakdown.map(row => (
                              <div key={row.label} className="flex justify-between text-xs py-0.5">
                                <span className="text-[#6B7280]">{row.label}</span>
                                <span className="text-[#2D2A26] font-semibold">{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Warnings if any */}
                        {calcResult.warnings.map(w => (
                          <div key={w} className="text-xs p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900">
                            ℹ {w}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-white border border-[#E5E0D8] text-sm text-[#7A8B99] text-center">
                  No direct financial calculator is configured for this scheme.
                </div>
              )}

              {/* Ask SchemeX Assistant CTA */}
              <div className="p-5 rounded-2xl border border-[#1E3A5F22] bg-[#1E3A5F08]">
                <div className="text-xs font-semibold text-[#1E3A5F] mb-1">Need help deciding?</div>
                <p className="text-xs text-[#6B7280] mb-3">
                  Ask the SchemeX Assistant about documents, application tips, or eligibility questions.
                </p>
                <button
                  onClick={() => onNavigate('assistant')}
                  className="w-full flex items-center gap-2 text-sm font-semibold py-2.5 justify-center rounded-xl text-white transition-all shadow hover:shadow-md"
                  style={{ backgroundColor: '#1E3A5F' }}
                >
                  ✦ Consult SchemeX Assistant
                </button>
              </div>

            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}

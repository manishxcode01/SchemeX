export interface SchemeRule {
  minAge?: number;
  maxAge?: number;
  maxIncome?: number;
  states?: string[];
  genders?: string[];
  requiresUdyam?: boolean;
  requiresGst?: boolean;
  requiresArtisan?: boolean;
  businessTypes?: string[];
  ruralOnly?: boolean;
  entrepreneurCategories?: string[];
}

export interface CalculatorInput {
  key: string;
  label: string;
  type: 'currency' | 'number' | 'percentage';
  required: boolean;
  min?: number;
  max?: number;
  profileKey?: string;
}

export interface Calculator {
  enabled: boolean;
  type: 'percentage_subsidy' | 'percentage_capped' | 'fixed' | 'loan_eligibility' | 'interest_subsidy';
  title: string;
  inputs: CalculatorInput[];
  percentage?: number;
  multiplier?: number;
  subsidyRate?: number;
  maxBenefit?: number;
  minBenefit?: number;
  fixedAmount?: number;
}

export interface Scheme {
  id: string;
  name: string;
  department: string;
  category: 'funding' | 'subsidy' | 'loan' | 'training' | 'equipment' | 'market_access';
  targetAudience: string[];
  description: string;
  benefits: string;
  eligibilityText: string;
  rules: SchemeRule;
  documents: { name: string; required: boolean }[];
  applicationProcess: string[];
  officialUrl: string;
  lastVerified: string;
  calculator?: Calculator;
  tags: string[];
}

export const DEFAULT_SCHEMES: Scheme[] = [
  {
    id: 'pmegp',
    name: 'Prime Minister\'s Employment Generation Programme',
    department: 'Ministry of MSME',
    category: 'funding',
    targetAudience: ['Entrepreneurs', 'MSMEs', 'Youth', 'Women'],
    description: 'PMEGP is a credit-linked subsidy scheme to generate employment opportunities by setting up new micro-enterprises in non-farm sector.',
    benefits: 'Margin money subsidy of 15%–35% of project cost. Urban: 15% (General), 25% (Special). Rural: 25% (General), 35% (Special).',
    eligibilityText: 'Age 18+, 8th pass for projects above ₹10 lakh (manufacturing), no income ceiling, project cost up to ₹50 lakh (mfg) or ₹20 lakh (service).',
    rules: { minAge: 18, requiresUdyam: false, requiresGst: false },
    documents: [
      { name: 'Aadhaar Card', required: true },
      { name: 'PAN Card', required: true },
      { name: 'Educational Certificate', required: true },
      { name: 'Project Report', required: true },
      { name: 'Bank Account Details', required: true },
      { name: 'Caste Certificate (if applicable)', required: false },
    ],
    applicationProcess: [
      'Apply online at kviconline.gov.in',
      'Submit application to nearest KVIC/KVIB/DIC office',
      'Interview and selection',
      'EDP training (if selected)',
      'Bank loan sanction',
      'Margin money disbursement',
    ],
    officialUrl: 'https://www.kviconline.gov.in/pmegpeportal',
    lastVerified: '2024-11-15',
    calculator: {
      enabled: true,
      type: 'percentage_capped',
      title: 'Margin Money Subsidy Calculator',
      inputs: [
        { key: 'projectCost', label: 'Project Cost', type: 'currency', required: true, min: 100000, max: 5000000, profileKey: 'businessInvestment' },
        { key: 'isRural', label: 'Location Type', type: 'number', required: true },
      ],
      percentage: 25,
      maxBenefit: 1250000,
    },
    tags: ['employment', 'startup', 'manufacturing', 'service'],
  },
  {
    id: 'mudra-shishu',
    name: 'Pradhan Mantri MUDRA Yojana – Shishu',
    department: 'Ministry of Finance',
    category: 'loan',
    targetAudience: ['Micro Enterprises', 'Small Businesses', 'Women', 'Youth'],
    description: 'MUDRA Shishu provides collateral-free loans up to ₹50,000 to micro-enterprises for income-generating activities.',
    benefits: 'Collateral-free loan up to ₹50,000 at competitive interest rates. Interest subvention of 2% available for prompt repayers.',
    eligibilityText: 'Non-corporate, non-farm small/micro enterprises. No minimum income requirement. New or existing businesses.',
    rules: { minAge: 18, requiresUdyam: false },
    documents: [
      { name: 'Aadhaar Card', required: true },
      { name: 'PAN Card', required: true },
      { name: 'Business Plan / Activity Description', required: true },
      { name: 'Bank Statement (6 months)', required: false },
    ],
    applicationProcess: [
      'Visit any public/private sector bank, MFI, or NBFC',
      'Fill MUDRA loan application form',
      'Submit documents',
      'Bank processes and sanctions loan',
      'Receive MUDRA Card for working capital',
    ],
    officialUrl: 'https://www.mudra.org.in',
    lastVerified: '2024-10-20',
    calculator: {
      enabled: true,
      type: 'loan_eligibility',
      title: 'Loan Eligibility Calculator',
      inputs: [
        { key: 'businessAge', label: 'Months in Business', type: 'number', required: true, min: 0 },
        { key: 'monthlyRevenue', label: 'Monthly Revenue', type: 'currency', required: true, min: 0 },
      ],
      maxBenefit: 50000,
      minBenefit: 10000,
    },
    tags: ['loan', 'micro-enterprise', 'collateral-free', 'working-capital'],
  },
  {
    id: 'stand-up-india',
    name: 'Stand-Up India Scheme',
    department: 'Ministry of Finance / SIDBI',
    category: 'loan',
    targetAudience: ['SC/ST Entrepreneurs', 'Women Entrepreneurs'],
    description: 'Stand-Up India facilitates bank loans between ₹10 lakh to ₹1 crore to at least one Scheduled Caste (SC) or Scheduled Tribe (ST) borrower and at least one woman borrower per bank branch for setting up greenfield enterprises.',
    benefits: 'Bank loan from ₹10 lakh to ₹1 crore. Composite loan of up to 75% of project cost including term loan and working capital.',
    eligibilityText: 'SC/ST or Women entrepreneur. Age 18+. Greenfield project (first-time in manufacturing, services, or trading). No default to any bank or financial institution.',
    rules: { minAge: 18, genders: ['Female'], entrepreneurCategories: ['SC', 'ST', 'Women'] },
    documents: [
      { name: 'Aadhaar Card', required: true },
      { name: 'PAN Card', required: true },
      { name: 'Caste Certificate (SC/ST)', required: false },
      { name: 'Project Report', required: true },
      { name: 'Bank Statement', required: true },
      { name: 'ITR (last 2 years, if applicable)', required: false },
    ],
    applicationProcess: [
      'Apply online at standupmitra.in',
      'Or visit nearest bank branch',
      'Submit application and documents',
      'Bank appraisal',
      'Loan sanction and disbursement',
    ],
    officialUrl: 'https://www.standupmitra.in',
    lastVerified: '2024-09-30',
    calculator: {
      enabled: true,
      type: 'percentage_capped',
      title: 'Loan Eligibility Estimator',
      inputs: [
        { key: 'projectCost', label: 'Total Project Cost', type: 'currency', required: true, min: 1000000, max: 13333334 },
      ],
      percentage: 75,
      maxBenefit: 10000000,
      minBenefit: 1000000,
    },
    tags: ['women', 'SC/ST', 'greenfield', 'bank-loan'],
  },
  {
    id: 'clcss',
    name: 'Credit Linked Capital Subsidy Scheme',
    department: 'Ministry of MSME',
    category: 'subsidy',
    targetAudience: ['MSMEs', 'Small Manufacturers'],
    description: 'CLCSS provides upfront capital subsidy of 15% on institutional credit up to ₹1 crore availed by MSMEs for technology upgradation.',
    benefits: '15% capital subsidy on institutional credit up to ₹1 crore. Maximum subsidy: ₹15 lakh.',
    eligibilityText: 'Existing micro and small enterprises registered under MSME. Must have Udyam registration. Technology upgradation in specified sectors.',
    rules: { minAge: 18, requiresUdyam: true, requiresGst: false },
    documents: [
      { name: 'Udyam Registration Certificate', required: true },
      { name: 'Bank Loan Sanction Letter', required: true },
      { name: 'Technology Upgradation Details', required: true },
      { name: 'Chartered Accountant Certificate', required: true },
      { name: 'Aadhaar Card', required: true },
    ],
    applicationProcess: [
      'Apply through bank/financial institution',
      'Bank submits application to SIDBI/NABARD/SBI',
      'Verification and processing',
      'Subsidy credited to loan account',
    ],
    officialUrl: 'https://clcss.dcmsme.gov.in',
    lastVerified: '2024-10-01',
    calculator: {
      enabled: true,
      type: 'percentage_capped',
      title: 'Capital Subsidy Calculator',
      inputs: [
        { key: 'loanAmount', label: 'Institutional Credit (Loan Amount)', type: 'currency', required: true, min: 100000, max: 10000000 },
      ],
      percentage: 15,
      maxBenefit: 1500000,
    },
    tags: ['technology', 'manufacturing', 'upgrade', 'subsidy'],
  },
  {
    id: 'weavers-mudra',
    name: 'Weavers MUDRA Scheme',
    department: 'Ministry of Textiles',
    category: 'loan',
    targetAudience: ['Weavers', 'Artisans', 'Handloom Workers'],
    description: 'The Weavers MUDRA Scheme provides credit at 6% interest rate to handloom weavers for their working capital and term loan requirements.',
    benefits: 'Loan up to ₹5 lakh at 6% interest rate. Interest subvention: difference between actual and 6% paid by government.',
    eligibilityText: 'Handloom weavers with weaver identity card. Must be engaged in weaving activity.',
    rules: { minAge: 18, requiresArtisan: true },
    documents: [
      { name: 'Weaver Identity Card', required: true },
      { name: 'Aadhaar Card', required: true },
      { name: 'Bank Account Details', required: true },
      { name: 'Proof of Handloom Activity', required: true },
    ],
    applicationProcess: [
      'Apply through designated bank or cooperative',
      'Submit weaver identity card and documents',
      'Bank sanctions loan at 6% rate',
      'Government pays interest subvention directly to bank',
    ],
    officialUrl: 'https://handlooms.nic.in',
    lastVerified: '2024-08-15',
    calculator: {
      enabled: true,
      type: 'interest_subsidy',
      title: 'Interest Savings Calculator',
      inputs: [
        { key: 'loanAmount', label: 'Loan Amount Required', type: 'currency', required: true, min: 10000, max: 500000 },
        { key: 'loanPeriod', label: 'Loan Period (Years)', type: 'number', required: true, min: 1, max: 5 },
      ],
      subsidyRate: 0.08,
      maxBenefit: 500000,
    },
    tags: ['artisan', 'handloom', 'weaver', 'interest-subvention'],
  },
  {
    id: 'msme-technology-centre',
    name: 'MSME Technology Centre Scheme',
    department: 'Ministry of MSME',
    category: 'training',
    targetAudience: ['MSMEs', 'Entrepreneurs', 'Youth', 'Artisans'],
    description: 'Technology Centres provide training, technical support, and common facility services to MSMEs for technology absorption and skill development.',
    benefits: 'Subsidized technical training, access to modern equipment, testing facilities, and product development support. Training fees subsidized by up to 70%.',
    eligibilityText: 'MSME owner or worker. Priority to SC/ST/Women/differently-abled entrepreneurs. No income ceiling.',
    rules: { minAge: 18, requiresUdyam: false },
    documents: [
      { name: 'Aadhaar Card', required: true },
      { name: 'Business Registration (any)', required: false },
      { name: 'Educational Certificate', required: false },
    ],
    applicationProcess: [
      'Identify nearest Technology Centre at msmetc.com',
      'Register online or visit in person',
      'Select relevant training programme',
      'Pay subsidized fee and attend training',
    ],
    officialUrl: 'https://www.msmetc.com',
    lastVerified: '2024-11-01',
    calculator: {
      enabled: true,
      type: 'percentage_capped',
      title: 'Training Subsidy Calculator',
      inputs: [
        { key: 'trainingFee', label: 'Training Programme Fee', type: 'currency', required: true, min: 5000, max: 200000 },
      ],
      percentage: 70,
      maxBenefit: 140000,
    },
    tags: ['training', 'skill', 'technology', 'capacity-building'],
  },
  {
    id: 'sfurti',
    name: 'SFURTI – Scheme of Fund for Regeneration of Traditional Industries',
    department: 'Ministry of MSME',
    category: 'market_access',
    targetAudience: ['Artisans', 'Traditional Industries', 'Rural Entrepreneurs'],
    description: 'SFURTI clusters traditional industries and artisans to make them more productive and competitive through common facility centres and market development support.',
    benefits: 'Common Facility Centre setup support, technology upgradation, marketing, packaging design, and capacity building. Grants up to ₹3 crore per cluster.',
    eligibilityText: 'Traditional artisans, Khadi, village, and coir industry workers. Must be part of a cluster of at least 50 artisans (regular) or 100+ (major).',
    rules: { minAge: 18, requiresArtisan: true },
    documents: [
      { name: 'Artisan Identity Card', required: false },
      { name: 'Cluster Formation Details', required: true },
      { name: 'Implementing Agency Details', required: true },
    ],
    applicationProcess: [
      'Form cluster of artisans',
      'Engage an Implementing Agency (IA)',
      'IA submits Diagnostic Study Report to KVIC/Coir Board/DCMSME',
      'Detailed Project Report preparation',
      'Cluster Development Executive approval',
      'Fund disbursement in phases',
    ],
    officialUrl: 'https://sfurti.msme.gov.in',
    lastVerified: '2024-09-01',
    tags: ['artisan', 'cluster', 'rural', 'traditional-industry'],
  },
  {
    id: 'gem-seller',
    name: 'GeM Seller Registration Support',
    department: 'Ministry of Commerce',
    category: 'market_access',
    targetAudience: ['MSMEs', 'Artisans', 'Women Entrepreneurs', 'SC/ST Entrepreneurs'],
    description: 'GeM (Government e-Marketplace) provides MSMEs direct access to government buyers. Special provisions for women and SC/ST sellers including price preference and purchase preferences.',
    benefits: '25% procurement reservation for MSMEs. Additional 3% for women-owned MSMEs. Price preference of up to 20% for qualifying MSMEs.',
    eligibilityText: 'Any registered business or individual seller. Udyam registration required for MSME price preference. GST registration required for taxable goods/services.',
    rules: { minAge: 18, requiresUdyam: true, requiresGst: true },
    documents: [
      { name: 'Udyam Registration Certificate', required: true },
      { name: 'GST Certificate', required: true },
      { name: 'Bank Account Details', required: true },
      { name: 'PAN Card', required: true },
    ],
    applicationProcess: [
      'Register at gem.gov.in',
      'Complete seller profile',
      'Upload Udyam and GST documents',
      'List products/services',
      'Respond to government bids and orders',
    ],
    officialUrl: 'https://gem.gov.in',
    lastVerified: '2024-11-10',
    tags: ['government-procurement', 'B2G', 'market-access', 'digital'],
  },
];

// Keep the interface useful before the first API response arrives. The local
// API seeds the same catalog on its first run, while Supabase can replace it.
export let SCHEMES: Scheme[] = [...DEFAULT_SCHEMES];

export let USER_PROFILE = {
  name: '',
  age: 0,
  gender: '',
  state: '',
  district: '',
  businessName: '',
  businessType: '',
  industry: '',
  businessStage: '',
  yearsInOperation: 0,
  annualTurnover: 0,
  employeeCount: 0,
  locationType: '',
  entrepreneurCategory: '',
  isArtisan: false,
  udyamRegistered: false,
  gstRegistered: false,
  annualIncome: 0,
  businessInvestment: 0,
  needs: [] as string[],
  documents: [] as string[],
};

export type UserProfile = typeof USER_PROFILE;

export const EMPTY_PROFILE: UserProfile = {
  name: '',
  age: 0,
  gender: '',
  state: '',
  district: '',
  businessName: '',
  businessType: '',
  industry: '',
  businessStage: '',
  yearsInOperation: 0,
  annualTurnover: 0,
  employeeCount: 0,
  locationType: '',
  entrepreneurCategory: '',
  isArtisan: false,
  udyamRegistered: false,
  gstRegistered: false,
  annualIncome: 0,
  businessInvestment: 0,
  needs: [] as string[],
  documents: [],
};

export function hydrateData(data: { schemes: Scheme[]; profile: typeof USER_PROFILE }) {
  SCHEMES = data.schemes;
  USER_PROFILE = data.profile;
}

export function checkEligibility(scheme: Scheme, profile: typeof USER_PROFILE) {
  const rules = scheme.rules;
  const satisfied: string[] = [];
  const failed: string[] = [];
  const missing: string[] = [];

  if (rules.minAge !== undefined) {
    if (profile.age >= rules.minAge) satisfied.push(`Age ${profile.age} meets minimum age of ${rules.minAge}`);
    else failed.push(`Age ${profile.age} is below minimum age of ${rules.minAge}`);
  }

  if (rules.maxAge !== undefined) {
    if (profile.age <= rules.maxAge) satisfied.push(`Age ${profile.age} is within maximum age of ${rules.maxAge}`);
    else failed.push(`Age ${profile.age} exceeds maximum age of ${rules.maxAge}`);
  }

  if (rules.maxIncome !== undefined) {
    if (profile.annualIncome <= rules.maxIncome) satisfied.push(`Annual income ₹${profile.annualIncome.toLocaleString('en-IN')} is within limit`);
    else failed.push(`Annual income exceeds limit of ₹${rules.maxIncome.toLocaleString('en-IN')}`);
  }

  if (rules.states && rules.states.length > 0) {
    if (rules.states.includes(profile.state)) satisfied.push(`State ${profile.state} is covered`);
    else failed.push(`State ${profile.state} is not covered (requires: ${rules.states.join(', ')})`);
  }

  if (rules.genders && rules.genders.length > 0) {
    if (rules.genders.includes(profile.gender)) satisfied.push(`Gender eligibility met`);
    else failed.push(`Gender requirement not met (requires: ${rules.genders.join('/')})`);
  }

  if (rules.requiresUdyam === true) {
    if (profile.udyamRegistered) satisfied.push('Udyam Registration: Present');
    else missing.push('Udyam Registration required');
  }

  if (rules.requiresGst === true) {
    if (profile.gstRegistered) satisfied.push('GST Registration: Present');
    else missing.push('GST Registration required');
  }

  if (rules.requiresArtisan === true) {
    if (profile.isArtisan) satisfied.push('Artisan / handloom worker status confirmed');
    else failed.push('Artisan / handloom status required');
  }

  if (rules.entrepreneurCategories && rules.entrepreneurCategories.length > 0) {
    const matches = rules.entrepreneurCategories.includes(profile.entrepreneurCategory) ||
      rules.entrepreneurCategories.includes('Women') && profile.gender === 'Female';
    if (matches) satisfied.push(`Entrepreneur category (${profile.entrepreneurCategory}) matches`);
    else failed.push(`Entrepreneur category must be: ${rules.entrepreneurCategories.join(' or ')}`);
  }

  const totalRequirements = satisfied.length + failed.length + missing.length;
  const matchScore = totalRequirements > 0
    ? Math.round((satisfied.length / totalRequirements) * 100)
    : 100;

  let status: 'ELIGIBLE' | 'NEAR_MISS' | 'NOT_MATCHED';
  if (failed.length === 0 && missing.length === 0) status = 'ELIGIBLE';
  else if (failed.length === 0 && missing.length > 0 && matchScore >= 60) status = 'NEAR_MISS';
  else if (failed.length === 0 && missing.length > 0) status = 'NEAR_MISS';
  else status = 'NOT_MATCHED';

  return { status, matchScore, satisfied, failed, missing };
}

export function calculateBenefit(scheme: Scheme, inputs: Record<string, number>): {
  result: number;
  breakdown: { label: string; value: string }[];
  formula: string;
  warnings: string[];
} {
  const calc = scheme.calculator;
  if (!calc || !calc.enabled) return { result: 0, breakdown: [], formula: '', warnings: [] };

  const warnings: string[] = [];
  let result = 0;
  let breakdown: { label: string; value: string }[] = [];
  let formula = '';

  if (calc.type === 'percentage_capped' || calc.type === 'percentage_subsidy') {
    const base = Object.values(inputs)[0] || 0;
    const inputLabel = calc.inputs[0]?.label || 'Amount';
    const pct = calc.percentage || 25;
    const calculated = base * (pct / 100);
    result = calc.maxBenefit ? Math.min(calculated, calc.maxBenefit) : calculated;

    breakdown = [
      { label: inputLabel, value: `₹${base.toLocaleString('en-IN')}` },
      { label: 'Subsidy Rate', value: `${pct}%` },
      { label: 'Calculated Subsidy', value: `₹${Math.round(calculated).toLocaleString('en-IN')}` },
    ];
    if (calc.maxBenefit) breakdown.push({ label: 'Maximum Allowed', value: `₹${calc.maxBenefit.toLocaleString('en-IN')}` });
    breakdown.push({ label: 'Final Estimated Benefit', value: `₹${Math.round(result).toLocaleString('en-IN')}` });
    formula = `₹${base.toLocaleString('en-IN')} × ${pct}% = ₹${Math.round(calculated).toLocaleString('en-IN')}${calc.maxBenefit && calculated > calc.maxBenefit ? ` (capped at ₹${calc.maxBenefit.toLocaleString('en-IN')})` : ''}`;

    if (calc.maxBenefit && calculated > calc.maxBenefit) {
      warnings.push(`Calculated subsidy exceeds maximum cap. Final benefit is ₹${calc.maxBenefit.toLocaleString('en-IN')}.`);
    }
  } else if (calc.type === 'loan_eligibility') {
    const months = inputs['businessAge'] || 0;
    const revenue = inputs['monthlyRevenue'] || 0;
    const base = revenue * Math.min(months, 12);
    result = Math.min(calc.maxBenefit || 50000, Math.max(calc.minBenefit || 10000, base * 2));
    breakdown = [
      { label: 'Monthly Revenue', value: `₹${revenue.toLocaleString('en-IN')}` },
      { label: 'Months in Business', value: `${months}` },
      { label: 'Estimated Annual Revenue', value: `₹${(revenue * 12).toLocaleString('en-IN')}` },
      { label: 'Estimated Eligible Loan', value: `₹${Math.round(result).toLocaleString('en-IN')}` },
    ];
    formula = `Based on revenue and business age, eligible for up to ₹${Math.round(result).toLocaleString('en-IN')}`;
  } else if (calc.type === 'interest_subsidy') {
    const loan = inputs['loanAmount'] || 0;
    const years = inputs['loanPeriod'] || 1;
    const rate = calc.subsidyRate || 0.08;
    result = loan * rate * years;
    breakdown = [
      { label: 'Loan Amount', value: `₹${loan.toLocaleString('en-IN')}` },
      { label: 'Interest Subvention Rate', value: `${(rate * 100).toFixed(0)}% per annum` },
      { label: 'Loan Period', value: `${years} years` },
      { label: 'Total Interest Savings', value: `₹${Math.round(result).toLocaleString('en-IN')}` },
    ];
    formula = `₹${loan.toLocaleString('en-IN')} × ${(rate * 100).toFixed(0)}% × ${years} years = ₹${Math.round(result).toLocaleString('en-IN')}`;
  } else if (calc.type === 'fixed') {
    result = calc.fixedAmount || 0;
    breakdown = [{ label: 'Fixed Benefit', value: `₹${result.toLocaleString('en-IN')}` }];
    formula = `Fixed benefit of ₹${result.toLocaleString('en-IN')}`;
  }

  return { result: Math.round(result), breakdown, formula, warnings };
}

export const formatINR = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(2)} Lakh` : `₹${n.toLocaleString('en-IN')}`;

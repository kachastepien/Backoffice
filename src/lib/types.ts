
export type CaseStatus = 'new' | 'analyzing' | 'opinion_draft' | 'card_ready' | 'closed';

export interface Case {
  id: string;
  applicantName: string;
  applicantPesel: string;
  accidentDate: string;
  businessType: string;
  status: CaseStatus;
  submissionDate: string;
  riskScore: number; // 0-100, calculated by "AI"
}

export const MOCK_CASES: Case[] = [
  {
    id: 'CS-2025-001',
    applicantName: 'Jan Kowalski',
    applicantPesel: '85010112345',
    accidentDate: '2025-05-12',
    businessType: 'Usługi Budowlane',
    status: 'new',
    submissionDate: '2025-05-14',
    riskScore: 0
  },
  {
    id: 'CS-2025-002',
    applicantName: 'Anna Nowak',
    applicantPesel: '92031554321',
    accidentDate: '2025-05-10',
    businessType: 'Programowanie',
    status: 'analyzing',
    submissionDate: '2025-05-11',
    riskScore: 35
  },
  {
    id: 'CS-2025-003',
    applicantName: 'Marek Zając',
    applicantPesel: '78112009876',
    accidentDate: '2025-04-28',
    businessType: 'Transport Drogowy',
    status: 'opinion_draft',
    submissionDate: '2025-05-01',
    riskScore: 80
  },
  {
    id: 'CS-2025-004',
    applicantName: 'Ewa Wiśniewska',
    applicantPesel: '88070711223',
    accidentDate: '2025-05-05',
    businessType: 'Fryzjerstwo',
    status: 'card_ready',
    submissionDate: '2025-05-06',
    riskScore: 10
  }
];

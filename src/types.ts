export type UserRole = 'user' | 'admin';

export type AuditTopic = 'work_processes' | 'challenges' | 'complaints' | 'suggestions' | 'general';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  jobRole?: string;
  department?: string;
  jobDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditInteraction {
  id: string;
  userId: string;
  sessionTitle: string;
  topic: AuditTopic;
  userInput: string;
  geminiResponse: string;
  insightsSummary?: string;
  brainstormingIdeas?: string;
  actionableSuggestions?: string;
  qualityAssessment?: string;
  userRole?: string;
  userDept?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyStandard {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  uploadedBy: string;
  uploadedByEmail: string;
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface GeminiAnalysisResponse {
  conversationalResponse: string;
  insightsSummary: string;
  brainstormingIdeas: string;
  actionableSuggestions: string;
  qualityAssessment: string;
}

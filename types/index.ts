// SaaS Tool types
export interface SaaSTool {
  name: string;
  category: SaaSCategory;
  icon: string;
}

// Enhanced vendor type with cost and matching patterns
export interface SaaSVendor {
  name: string;
  category: SaaSCategory;
  icon: string;
  typicalMonthlyCost: number;
  patterns: string[];
}

export type SaaSCategory =
  | "Communication"
  | "Project Management"
  | "Design"
  | "Dev Tools"
  | "CRM"
  | "Marketing"
  | "HR"
  | "Finance"
  | "Customer Support"
  | "Security"
  | "Productivity"
  | "AI Tools";

// Transaction types
export interface Transaction {
  description: string;
  amount: number;
  date: string;
}

export interface DetectedSubscription extends Transaction {
  saasName: string;
  category: SaaSCategory;
  icon: string;
  matched: boolean;
  status?: FindingStatus;
  statusLabel?: string;
}

export type FindingStatus = "waste" | "duplicate" | "review" | "good";

// Analysis results
export interface AnalysisFindings {
  waste: DetectedSubscription[];
  duplicate: DetectedSubscription[];
  review: DetectedSubscription[];
  good: DetectedSubscription[];
}

export interface AnalysisSummary {
  totalSpend: number;
  subscriptionCount: number;
  potentialSavings: number;
  duplicateCount: number;
}

export interface AnalysisResults {
  findings: AnalysisFindings;
  summary: AnalysisSummary;
  categoryMap: Record<string, DetectedSubscription[]>;
  allSubscriptions: DetectedSubscription[];
}

// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Email subscription
export interface EmailSubscription {
  email: string;
  subscribedAt: Date;
  source?: string;
}

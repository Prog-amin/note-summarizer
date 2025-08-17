// Legacy demo response type
export interface DemoResponse {
  message: string;
}

// Meeting Summary API types
export interface GenerateSummaryRequest {
  transcript: string;
  customPrompt: string;
}

export interface GenerateSummaryResponse {
  summary: string;
  error?: string;
}

export interface ShareSummaryRequest {
  summary: string;
  recipients: string[];
}

export interface ShareSummaryResponse {
  success: boolean;
  error?: string;
}

/** Report types for content reporting */
export const REPORT_TYPES = [
  { id: 'spam', label: 'Spam' },
  { id: 'inappropriate', label: 'Inappropriate content' },
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'violence', label: 'Violence or dangerous content' },
  { id: 'hate_speech', label: 'Hate speech or symbols' },
  { id: 'false_info', label: 'False information' },
  { id: 'copyright', label: 'Copyright violation' },
  { id: 'other', label: 'Other' },
] as const;

export type ReportTypeId = (typeof REPORT_TYPES)[number]['id'];

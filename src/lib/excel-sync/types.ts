export interface SyncResult {
  type: 'jd' | 'resume' | 'interview' | 'comparison';
  sheet: string;
  status: 'success' | 'error';
  message?: string;
  id?: string;
  isUpdate?: boolean;
}

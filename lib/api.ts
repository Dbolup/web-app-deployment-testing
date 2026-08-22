const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Auth token helpers
// ---------------------------------------------------------------------------

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

// Mirrors what middleware.ts checks server-side. localStorage's access_token
// has no expiry of its own, so it can outlive the cookie (max-age=3600) and
// wrongly look "logged in" — checking the cookie instead keeps this in sync
// with what the middleware will actually accept.
export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith('access_token='));
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  // Also write a short-lived cookie so the middleware can gate server routes
  document.cookie = `access_token=${access}; path=/; max-age=3600; SameSite=Lax`;
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  document.cookie = 'access_token=; path=/; max-age=0';
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return null;
  const res = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) { clearTokens(); return null; }
  const data = await res.json();
  localStorage.setItem('access_token', data.access);
  document.cookie = `access_token=${data.access}; path=/; max-age=3600; SameSite=Lax`;
  return data.access;
}

// ---------------------------------------------------------------------------
// Core fetch wrapper — retries once after a 401 by refreshing the token
// ---------------------------------------------------------------------------

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  let token = getAccessToken();

  const doFetch = (t: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...options.headers,
      },
    });

  let res = await doFetch(token);

  if (res.status === 401) {
    token = await refreshAccessToken();
    if (token) res = await doFetch(token);
  }

  return res;
}

// ---------------------------------------------------------------------------
// Settings types & helpers
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar: string | null;
  role: string;
  created_at: string;
}

export interface WorkspaceSettings {
  id: number;
  name: string;
  storage_used: number;
  storage_limit: number;
  storage_used_percent: number;
  ai_sensitivity: 'strict' | 'balanced' | 'broad';
  keywords: string[];
  member_count: number;
}

export interface TeamMember {
  id: number;
  user: UserProfile;
  role: 'super_admin' | 'reviewer' | 'editor';
  status: 'active' | 'pending';
  invited_at: string;
}

export interface Integration {
  id: number;
  name: string;
  integration_type: 'gov_tender' | 'confluence' | 'slack' | 'teams' | 'other';
  status: 'connected' | 'disconnected' | 'error';
}

export async function getMe(): Promise<UserProfile> {
  const res = await apiFetch('/api/auth/me/');
  if (!res.ok) throw new Error('Failed to load profile');
  return res.json();
}

export async function updateMe(data: Partial<Pick<UserProfile, 'first_name' | 'last_name' | 'role'>>): Promise<UserProfile> {
  const res = await apiFetch('/api/auth/me/', { method: 'PATCH', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function getWorkspace(): Promise<WorkspaceSettings> {
  const res = await apiFetch('/api/auth/workspace/');
  if (!res.ok) throw new Error('Failed to load workspace');
  return res.json();
}

export async function updateWorkspace(data: Partial<Pick<WorkspaceSettings, 'name' | 'ai_sensitivity' | 'keywords'>>): Promise<WorkspaceSettings> {
  const res = await apiFetch('/api/auth/workspace/', { method: 'PATCH', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to save workspace settings');
  return res.json();
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const res = await apiFetch('/api/auth/team/');
  if (!res.ok) throw new Error('Failed to load team');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function inviteUser(email: string, role: string): Promise<void> {
  const res = await apiFetch('/api/auth/invite/', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const first = Object.values(err)[0];
    throw new Error(Array.isArray(first) ? first[0] : 'Failed to send invitation');
  }
}

export async function removeTeamMember(id: number): Promise<void> {
  const res = await apiFetch(`/api/auth/team/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove member');
}

export interface PendingInvitation {
  id: number;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

export async function getPendingInvitations(): Promise<PendingInvitation[]> {
  const res = await apiFetch('/api/auth/invite/pending/');
  if (!res.ok) throw new Error('Failed to load invitations');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function cancelInvitation(id: number): Promise<void> {
  const res = await apiFetch(`/api/auth/invite/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to cancel invitation');
}

export interface InvitePreview {
  workspace_name: string;
  role: string;
  email: string;
  has_account: boolean;
}

export async function getInvitePreview(token: string): Promise<InvitePreview> {
  const res = await apiFetch(`/api/auth/invite/accept/${token}/`, { method: 'GET' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Invalid or expired invitation');
  }
  return res.json();
}

export async function acceptInvite(token: string): Promise<void> {
  const res = await apiFetch(`/api/auth/invite/accept/${token}/`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Failed to accept invitation');
  }
}

export interface AcceptInviteAccountDetails {
  first_name: string;
  last_name: string;
  password: string;
}

// For an invitee with no existing account: creates one and accepts the
// invitation in the same request, returning tokens so they land signed in.
export async function acceptInviteWithNewAccount(
  token: string,
  details: AcceptInviteAccountDetails
): Promise<{ access: string; refresh: string }> {
  const res = await apiFetch(`/api/auth/invite/accept/${token}/`, {
    method: 'POST',
    body: JSON.stringify(details),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail ?? 'Failed to accept invitation');
  }
  return data;
}

export async function getIntegrations(): Promise<Integration[]> {
  const res = await apiFetch('/api/integrations/');
  if (!res.ok) throw new Error('Failed to load integrations');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function disconnectIntegration(id: number): Promise<void> {
  const res = await apiFetch(`/api/integrations/${id}/disconnect/`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to disconnect');
}

export async function changePassword(old_password: string, new_password: string): Promise<void> {
  const res = await apiFetch('/api/auth/change-password/', {
    method: 'POST',
    body: JSON.stringify({ old_password, new_password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const first = Object.values(err)[0];
    throw new Error(Array.isArray(first) ? first[0] : 'Failed to change password');
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TenderScore {
  id: number;
  ai_score: number | null;
  status: 'new' | 'selected' | 'reviewed' | 'pursue' | 'review' | 'skip';
  feasibility_score: number | null;
  risk_level: 'low' | 'medium' | 'high' | null;
  capability_alignment: { label: string; met: boolean }[];
  executive_summary: string;
}

export interface Tender {
  id: number;
  ref_id: string;
  title: string;
  organization: string;
  department: string;
  budget_display: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  published_date: string | null;
  days_until_deadline: number | null;
  location: string;
  industry: string;
  notice_type: string;
  source_url: string;
  score: TenderScore | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TenderFilters {
  search: string;
  industry: string;
  location: string;
  organization: string;
  notice_type: string;
  budget_max: string;
  deadline_before: string;
  ordering: string;
  page: number;
  page_size: number;
}

export const DEFAULT_FILTERS: TenderFilters = {
  search: '',
  industry: '',
  location: '',
  organization: '',
  notice_type: '',
  budget_max: '',
  deadline_before: '',
  ordering: '-published_date',
  page: 1,
  page_size: 20,
};

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  workspace_name: string;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const res = await fetch(`${BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? err.non_field_errors?.[0] ?? 'Login failed');
  }
  return res.json();
}

export async function register(payload: RegisterPayload): Promise<AuthTokens> {
  const res = await fetch(`${BASE_URL}/api/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const first = Object.values(err)[0];
    throw new Error(Array.isArray(first) ? first[0] : 'Registration failed');
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Company Profile API
// ---------------------------------------------------------------------------

export interface CompanyProfilePayload {
  company_name: string;
  description: string;
  capabilities: string[];
  certifications: string[];
  sectors: string[];
  typical_contract_min: number | null;
  typical_contract_max: number | null;
  excluded_keywords: string[];
  preferred_notice_types: string[];
  onboarding_completed: boolean;
}

export async function saveCompanyProfile(payload: CompanyProfilePayload): Promise<void> {
  const res = await apiFetch('/api/ai-review/company/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const first = Object.values(err)[0];
    throw new Error(Array.isArray(first) ? first[0] : 'Failed to save profile');
  }
}

export async function getCompanyProfile(): Promise<CompanyProfilePayload | null> {
  const res = await apiFetch('/api/ai-review/company/');
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

// ---------------------------------------------------------------------------
// AI Suggestions
// ---------------------------------------------------------------------------

export interface TenderSuggestion {
  ref_id: string;
  title: string;
  organization: string;
  deadline: string | null;
  budget_min: number | null;
  budget_max: number | null;
  industry: string | null;
  ai_score: number | null;
  feasibility_score: number | null;
  risk_level: string | null;
  recommendation: string | null;
  executive_summary: string | null;
}

export async function fetchAISuggestions(
  limit = 100,
  recommendation = 'pursue,review',
): Promise<TenderSuggestion[]> {
  const res = await apiFetch(
    `/api/ai-review/suggestions/?limit=${limit}&recommendation=${recommendation}`,
  );
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

/** Convert a suggestion to the Tender shape so TenderRow renders it unchanged */
export function suggestionToTender(s: TenderSuggestion): Tender {
  return {
    id: 0,
    ref_id: s.ref_id,
    title: s.title,
    organization: s.organization ?? '',
    department: '',
    budget_display: '',
    budget_min: s.budget_min,
    budget_max: s.budget_max,
    deadline: s.deadline,
    published_date: null,
    days_until_deadline: null,
    location: '',
    industry: s.industry ?? '',
    notice_type: '',
    source_url: '',
    score: s.ai_score !== null
      ? {
          id: 0,
          ai_score: s.ai_score,
          status: (s.recommendation ?? 'new') as TenderScore['status'],
          feasibility_score: s.feasibility_score,
          risk_level: s.risk_level as 'low' | 'medium' | 'high' | null,
          capability_alignment: [],
          executive_summary: s.executive_summary ?? '',
        }
      : null,
    created_at: '',
  };
}

// ---------------------------------------------------------------------------
// Tender API helpers
// ---------------------------------------------------------------------------

export async function fetchTenders(
  filters: Partial<TenderFilters>
): Promise<PaginatedResponse<Tender>> {
  const params = new URLSearchParams();
  const f = { ...DEFAULT_FILTERS, ...filters };

  if (f.search) params.set('search', f.search);
  if (f.industry) params.set('industry', f.industry);
  if (f.location) params.set('location', f.location);
  if (f.organization) params.set('organization', f.organization);
  if (f.notice_type) params.set('notice_type', f.notice_type);
  if (f.budget_max) params.set('budget_max', f.budget_max);
  if (f.deadline_before) params.set('deadline_before', f.deadline_before);
  if (f.ordering) params.set('ordering', f.ordering);
  params.set('page', String(f.page));
  params.set('page_size', String(f.page_size));

  const res = await apiFetch(`/api/tenders/?${params.toString()}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function getTenderDetail(ref_id: string): Promise<TenderDetail> {
  const res = await apiFetch(`/api/tenders/${ref_id}/`);
  if (!res.ok) throw new Error('Tender not found');
  return res.json();
}

// ---------------------------------------------------------------------------
// Dashboard API
// ---------------------------------------------------------------------------

export interface TrendPoint {
  date: string;
  count: number;
}

export interface DashboardStats {
  total_tenders: number;
  ai_qualified: number;
  in_progress: number;
  submitted: number;
  trend_data: TrendPoint[];
}

export interface ActivityItem {
  id: number;
  activity_type: 'ai' | 'system' | 'user' | 'drafted';
  prefix: string;
  highlight: string;
  tender: number | null;
  tender_ref: string | null;
  created_at: string;
}

export async function getDashboardStats(days = 30): Promise<DashboardStats> {
  const res = await apiFetch(`/api/dashboard/stats/?days=${days}`);
  if (!res.ok) throw new Error('Failed to load dashboard stats');
  return res.json();
}

export async function getTopTenders(limit = 3): Promise<Tender[]> {
  const res = await apiFetch(`/api/dashboard/top-tenders/?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load top tenders');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function getActivity(): Promise<ActivityItem[]> {
  const res = await apiFetch('/api/dashboard/activity/');
  if (!res.ok) throw new Error('Failed to load activity');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results ?? []);
}

// ---------------------------------------------------------------------------
// Tender detail (full)
// ---------------------------------------------------------------------------

export interface TenderDetail extends Tender {
  description: string;
  scope: string;
  deliverables: string[];
  evaluation_criteria: Record<string, unknown>;
  timeline: Record<string, unknown>;
  cpv_codes: string[];
  updated_at: string;
}

// ---------------------------------------------------------------------------
// AI Review API
// ---------------------------------------------------------------------------

export interface AIReviewData {
  id: number;
  ai_score: number | null;
  feasibility_score: number | null;
  risk_level: 'low' | 'medium' | 'high' | null;
  capability_alignment: { label: string; met: boolean }[];
  executive_summary: string;
  recommendation: 'pursue' | 'review' | 'skip' | null;
  rationale: string;
  review_status: 'pending' | 'completed' | 'failed';
  model_used: string;
  created_at: string;
}

// Handles both old {name, status} and new {label, met} formats from stored reviews
function normalizeReview(data: any): AIReviewData {
  const caps = (data.capability_alignment ?? []).map((c: any) => {
    if ('label' in c) return c as { label: string; met: boolean };
    // Old format: name + status enum
    return {
      label: c.name ?? '',
      met: c.status === 'Requirement Met',
    };
  });
  return { ...data, capability_alignment: caps };
}

export async function getAIReview(ref_id: string): Promise<AIReviewData | null> {
  const res = await apiFetch(`/api/ai-review/tenders/${ref_id}/review/`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load review');
  return normalizeReview(await res.json());
}

export async function triggerAIReview(ref_id: string): Promise<AIReviewData> {
  const res = await apiFetch(`/api/ai-review/tenders/${ref_id}/review/`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail ?? 'AI review failed');
  }
  return normalizeReview(await res.json());
}

// ---------------------------------------------------------------------------
// Pipeline API
// ---------------------------------------------------------------------------

export interface StageHistoryItem {
  id: number;
  from_stage: string;
  to_stage: string;
  changed_by: UserProfile;
  changed_at: string;
  note: string;
}

export interface BackendPipelineItem {
  id: number;
  tender: Tender;
  stage: string;
  assigned_to: UserProfile | null;
  notes: string;
  stage_history: StageHistoryItem[];
  created_at: string;
  updated_at: string;
}

export interface KanbanColumn {
  stage: string;
  label: string;
  count: number;
  items: BackendPipelineItem[];
}

export async function getPipelineKanban(): Promise<KanbanColumn[]> {
  const res = await apiFetch('/api/pipeline/kanban/');
  if (!res.ok) throw new Error('Failed to load pipeline');
  return res.json();
}

export async function getPipelineItems(): Promise<BackendPipelineItem[]> {
  const res = await apiFetch('/api/pipeline/');
  if (!res.ok) throw new Error('Failed to load pipeline items');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function movePipelineItem(id: number, stage: string, note = ''): Promise<BackendPipelineItem> {
  const res = await apiFetch(`/api/pipeline/${id}/move/`, {
    method: 'POST',
    body: JSON.stringify({ stage, note }),
  });
  if (!res.ok) throw new Error('Failed to move item');
  return res.json();
}

export async function addToPipeline(tender_id: number, stage = 'new'): Promise<BackendPipelineItem> {
  const res = await apiFetch('/api/pipeline/', {
    method: 'POST',
    body: JSON.stringify({ tender_id, stage }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const first = Object.values(err)[0];
    throw new Error(Array.isArray(first) ? first[0] : 'Failed to add to pipeline');
  }
  return res.json();
}

export async function removePipelineItem(id: number): Promise<void> {
  const res = await apiFetch(`/api/pipeline/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove from pipeline');
}

export async function sendReviewEmail(refId: string, emails: string[]): Promise<void> {
  const res = await apiFetch('/api/pipeline/send-review-email/', {
    method: 'POST',
    body: JSON.stringify({ ref_id: refId, emails }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to send email');
  }
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export interface ExtractedSection {
  id: number;
  section_type: 'scope_of_work' | 'deliverables' | 'evaluation_criteria' | 'timeline' | 'requirements' | 'other';
  title: string;
  content: unknown;
  accuracy_score: number;
  ai_verified: boolean;
  created_at: string;
}

export interface Doc {
  id: number;
  tender: number | null;
  filename: string;
  file: string;
  file_size: number;
  file_size_display: string;
  mime_type: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  processing_progress: number;
  pages_count: number;
  sections: ExtractedSection[];
  created_at: string;
  updated_at: string;
}

async function apiFetchUpload(path: string, formData: FormData): Promise<Response> {
  let token = getAccessToken();
  const doFetch = (t: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: t ? { Authorization: `Bearer ${t}` } : {},
      body: formData,
    });
  let res = await doFetch(token);
  if (res.status === 401) {
    token = await refreshAccessToken();
    if (token) res = await doFetch(token);
  }
  return res;
}

export async function listDocuments(): Promise<Doc[]> {
  const res = await apiFetch('/api/documents/');
  if (!res.ok) throw new Error('Failed to load documents');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function uploadDocument(file: File, tenderId?: number): Promise<Doc> {
  const fd = new FormData();
  fd.append('file', file);
  if (tenderId) fd.append('tender', String(tenderId));
  const res = await apiFetchUpload('/api/documents/upload/', fd);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Upload failed');
  }
  return res.json();
}

export async function processDocument(id: number): Promise<Doc> {
  const res = await apiFetch(`/api/documents/${id}/process/`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Failed to start processing');
  }
  return res.json();
}

export async function getDocument(id: number): Promise<Doc> {
  const res = await apiFetch(`/api/documents/${id}/`);
  if (!res.ok) throw new Error('Failed to load document');
  return res.json();
}

export async function getDocumentSections(id: number): Promise<ExtractedSection[]> {
  const res = await apiFetch(`/api/documents/${id}/sections/`);
  if (!res.ok) throw new Error('Failed to load sections');
  return res.json();
}

export async function deleteDocument(id: number): Promise<void> {
  const res = await apiFetch(`/api/documents/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete document');
}

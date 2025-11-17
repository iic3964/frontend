// API Response Wrapper
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Pagination & Metadata
export type PaginationMetadata = {
  page: number;
  page_size: number;
  count: number;
  total: number;
};

export type PaginatedResponse<T> = PaginationMetadata & {
  results: T[];
};

// Request/Response Types

export type Patient = {
  rut: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

export type Doctor = {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

export type ClinicalAttention = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  overwritten_by: string | null;
  overwritten_reason: string | null;
  patient: Patient;
  resident_doctor: Doctor;
  supervisor_doctor: Doctor;
  applies_urgency_law: boolean | null;
  ai_result: boolean | null;
  ai_reason: string | null;
  diagnostic: string | null;
};

export type CreateClinicalAttentionRequest = {
  patient_id: string;
  resident_doctor_id: string;
  supervisor_doctor_id: string;
  diagnostic: string;
};

export type UpdateClinicalAttentionRequest = {
  patient?: string;
  resident_doctor_id?: string;
  diagnostic: string;
  is_deleted?: boolean;
}

// --- Auth Types (Based on FastAPI models) ---

/**
 * Payload for /auth/login
 * Matches FastAPI 'UserAuth'
 */
export type LoginPayload = {
  email: string;
  password: string;
};

/**
 * Payload for /auth/register
 * Matches FastAPI 'UserCreate'
 */
export type RegisterPayload = {
  email: string;
  password: string;
  first: string;
  last: string;
};

/**
 * Supabase User Object
 * The core user data returned by Supabase
 */
export type AuthUser = {
  id: string;
  email?: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    [key: string]: any;
  };
  [key: string]: any;
};

/**
 * Supabase Session Object
 * Contains the user and tokens
 */
export type AuthSession = {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  [key: string]: any;
};

/**
 * Expected response from /auth/register
 */
export type RegisterResponse = {
  user: AuthUser;
};

/**
 * Expected response from /auth/login
 * This matches the 'AuthResponse' I used previously.
 */
export type LoginResponse = {
  session: AuthSession;
};
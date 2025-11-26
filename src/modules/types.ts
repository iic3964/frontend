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
  mother_last_name?: string;
  age?: number;
  sex?: string;
  height?: number;
  weight?: number;
  aseguradora?: string; // TODO: cambiar al objeto
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

// Doctor object returned by the `GET /get-doctors` endpoint includes an id
export type DoctorWithId = Doctor & {
  id: string;
};

// Patient object returned by list endpoints includes an id
export type PatientWithId = Patient & {
  id: string;
};

export interface CreatePatientRequest {
  rut: string;
  first_name: string;
  last_name: string;
  mother_last_name?: string;
  age?: number;
  sex?: string;
  height?: number;
  weight?: number;
  aseguradora?: string; // TODO: cambiar al objeto
}

export interface UpdatePatientRequest {
  rut?: string;
  first_name?: string;
  last_name?: string;
  mother_last_name?: string;
  age?: number;
  sex?: string;
  height?: number;
  weight?: number;
  aseguradora?: string; // TODO: cambiar al objeto
}

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

export type UserRole = 'resident' | 'supervisor' | 'admin';

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
    role?: UserRole;
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

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: UserRole;
}

export type UserWithRole = DoctorWithId & {
  role: UserRole;
};

export interface InsuranceCompany {
  id: number;
  nombre_comercial: string | null;
  nombre_juridico: string;
  rut: string | null;
}

export interface CreateInsuranceCompanyRequest {
  nombre_comercial?: string | null;
  nombre_juridico: string;
  rut?: string | null;
}

export interface UpdateInsuranceCompanyRequest {
  nombre_comercial?: string | null;
  nombre_juridico?: string | null;
  rut?: string | null;
}

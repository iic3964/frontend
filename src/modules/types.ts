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
  aseguradora?: string;
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

export type DoctorWithId = Doctor & {
  id: string;
};

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
  aseguradora?: string;
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
  aseguradora?: string;
}

export type ClinicalAttention = {
  id: string;
  id_episodio?: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  overwritten_by: string | null;
  overwritten_reason: string | null;
  medic_approved?: boolean | null;
  patient: Patient;
  resident_doctor: Doctor;
  supervisor_doctor: Doctor;
  applies_urgency_law: boolean | null;
  ai_result: boolean | null;
  ai_reason: string | null;
  ai_confidence?: number | null;
  diagnostic: string | null;
};

export type CreateClinicalAttentionRequest = {
  patient_id: string;
  resident_doctor_id: string;
  supervisor_doctor_id: string;
  diagnostic: string;
  id_episodio?: string;
};

export type UpdateClinicalAttentionRequest = {
  patient?: string;
  resident_doctor_id?: string;
  diagnostic?: string;
  is_deleted?: boolean;
  clinical_summary_txt?: string;
  id_episodio?: string;
  overwritten_by?: string | null;
  overwritten_reason?: string | null;
  medic_approved?: boolean | null;
};

export type UserRole = "resident" | "supervisor" | "admin";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  first: string;
  last: string;
};

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

export type AuthSession = {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  [key: string]: any;
};

export type RegisterResponse = {
  user: AuthUser;
};

export type LoginResponse = {
  session: AuthSession;
};

export interface CreateUserRequest {
  email: string;
  password: string;
  first: string;
  last: string;
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
  is_deleted: boolean;
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

export type ClinicalAttentionHistoryItem = {
  id: string;
  id_episodio: string | null;
  created_at: string | null;
  resident_doctor_name: string | null;
  supervisor_doctor_name: string | null;
  applies_urgency_law: boolean | null;
};

export type PatientClinicalHistory = {
  patient_id: string;
  attentions: ClinicalAttentionHistoryItem[];
};

export type ClinicalAttentionHistoryRequest = {
  patient_ids: string[];
};

export type ClinicalAttentionHistoryResponse = {
  patients: PatientClinicalHistory[];
};

export type MetricStats = {
  id: string | number | null;
  name: string;
  total_episodes: number;

  total_urgency_law: number;
  percent_urgency_law_rejected: number;

  total_ai_yes: number;
  percent_ai_yes_rejected: number;

  total_ai_no_medic_yes: number;
  percent_ai_no_medic_yes_rejected: number;
};

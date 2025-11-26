import { API_URL } from "astro:env/client";
import type {
  ApiResponse,
  ClinicalAttention,
  CreateClinicalAttentionRequest,
  DoctorWithId,
  InsuranceCompany,
  LoginPayload,
  LoginResponse,
  PaginatedResponse,
  PatientWithId,
  CreatePatientRequest,
  UpdatePatientRequest,
  CreateUserRequest,
  UpdateUserRequest,
  UserWithRole,
  RegisterPayload,
  RegisterResponse,
  UpdateClinicalAttentionRequest,
  CreateInsuranceCompanyRequest,
  UpdateInsuranceCompanyRequest,
} from "./types";

type QueryParams = Record<string, string | number | boolean | undefined>;

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL || "http://localhost:8000/v1";
  }

  private buildUrl(endpoint: string, params?: QueryParams): string {
    if (!params || Object.keys(params).length === 0) return endpoint;

    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });

    const queryString = query.toString();
    return queryString ? `${endpoint}?${queryString}` : endpoint;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    params?: QueryParams
  ): Promise<ApiResponse<T>> {
    try {
      const fullEndpoint = this.buildUrl(endpoint, params);
      const url = `${this.baseUrl}${fullEndpoint}`;

      // Aseguramos headers
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Handle empty responses (like DELETE 204 No Content)
      const contentType = response.headers.get("content-type");
      if (
        response.status === 204 ||
        !contentType?.includes("application/json")
      ) {
        return { success: true, data: undefined as T };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
  // Auth endpoints

  async login(payload: LoginPayload): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async registerUser(
    payload: CreateUserRequest
  ): Promise<ApiResponse<RegisterResponse>> {
    const body = {
      email: payload.email,
      password: payload.password,
      first: payload.first_name,
      last: payload.last_name,
      role: payload.role,
    };

    return this.request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // Medics / Doctors
  async getMedics(): Promise<
    ApiResponse<{ resident: DoctorWithId[]; supervisor: DoctorWithId[] }>
  > {
    return this.request<{
      resident: DoctorWithId[];
      supervisor: DoctorWithId[];
    }>("/doctors/get-doctors");
  }

  async updateDoctor(
    id: string,
    payload: UpdateUserRequest
  ): Promise<ApiResponse<UserWithRole>> {
    return this.request<UserWithRole>(`/doctors/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  // Patients
  async getPatients(): Promise<ApiResponse<{ patients: PatientWithId[] }>> {
    return this.request<{ patients: PatientWithId[] }>("/patients/patients");
  }

  // Obtener uno por ID
  async getPatient(id: string): Promise<ApiResponse<PatientWithId>> {
    return this.request<PatientWithId>(`/patients/${id}`);
  }

  // Crear
  async createPatient(
    payload: CreatePatientRequest
  ): Promise<ApiResponse<PatientWithId>> {
    return this.request<PatientWithId>("/patients", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Actualizar
  async updatePatient(
    id: string,
    payload: UpdatePatientRequest
  ): Promise<ApiResponse<PatientWithId>> {
    return this.request<PatientWithId>(`/patients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  // clinical attentions endpoints

  async getClinicalAttentions(pagination?: {
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<PaginatedResponse<ClinicalAttention>>> {
    return this.request<PaginatedResponse<ClinicalAttention>>(
      "/clinical_attentions",
      {},
      pagination
    );
  }

  async createClinicalAttention(
    clinicalAttention: CreateClinicalAttentionRequest
  ): Promise<ApiResponse<ClinicalAttention>> {
    return this.request<ClinicalAttention>("/clinical_attentions", {
      method: "POST",
      body: JSON.stringify(clinicalAttention),
    });
  }

  async getClinicalAttention(
    id: string
  ): Promise<ApiResponse<ClinicalAttention>> {
    return this.request<ClinicalAttention>(`/clinical_attentions/${id}`);
  }

  async updateClinicalAttention(
    id: string,
    clinicalAttention: UpdateClinicalAttentionRequest
  ): Promise<ApiResponse<ClinicalAttention>> {
    return this.request<ClinicalAttention>(`/clinical_attentions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(clinicalAttention),
    });
  }

  async AproveClinicalAttention(
    id: string,
    approved: boolean,
    reason: string,
    medic_id: string
  ): Promise<ApiResponse<ClinicalAttention>> {
    return this.request<ClinicalAttention>(
      `/clinical_attentions/${id}/medic_approval`,
      {
        method: "PATCH",
        body: JSON.stringify({ approved, reason, medic_id }),
      }
    );
  }

  async deleteClinicalAttention(
    id: string,
    deleted_by_id: string
  ): Promise<ApiResponse<void>> {
    return this.request<void>(`/clinical_attentions/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ deleted_by_id }),
    });
  }

  // ================================
  // Insurance Companies CRUD
  // ================================

  async getInsuranceCompanies(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    order?: string;
  }): Promise<ApiResponse<PaginatedResponse<InsuranceCompany>>> {
    console.log("Fetching insurance companies with params:", params);
    return this.request<PaginatedResponse<InsuranceCompany>>(
      "/insurance_companies",
      {},
      params
    );
  }

  async getInsuranceCompany(
    id: number
  ): Promise<ApiResponse<InsuranceCompany>> {
    return this.request<InsuranceCompany>(`/insurance_companies/${id}`);
  }

  async createInsuranceCompany(
    payload: CreateInsuranceCompanyRequest
  ): Promise<ApiResponse<InsuranceCompany>> {
    return this.request<InsuranceCompany>("/insurance_companies", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateInsuranceCompany(
    id: number,
    payload: UpdateInsuranceCompanyRequest
  ): Promise<ApiResponse<InsuranceCompany>> {
    return this.request<InsuranceCompany>(`/insurance_companies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteInsuranceCompany(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/insurance_companies/${id}`, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient();

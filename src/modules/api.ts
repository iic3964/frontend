import { API_URL } from "astro:env/client";
import type {
  ApiResponse,
  ClinicalAttention,
  ClinicalAttentionHistoryRequest,
  ClinicalAttentionHistoryResponse,
  CreateClinicalAttentionRequest,
  CreateInsuranceCompanyRequest,
  CreatePatientRequest,
  CreateUserRequest,
  DoctorWithId,
  InsuranceCompany,
  LoginPayload,
  LoginResponse,
  MetricStats,
  PaginatedResponse,
  PatientWithId,
  RegisterResponse,
  UpdateClinicalAttentionRequest,
  UpdateInsuranceCompanyRequest,
  UpdatePatientRequest,
  UpdateUserRequest,
  UserWithRole,
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
          data: await response.json() as unknown as T,
        };
      }

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
      console.error(JSON.stringify(error));
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
      first: payload.first,
      last: payload.last,
      role: payload.role,
    };

    return this.request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getUsers(params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<UserWithRole>>> {
    return this.request<PaginatedResponse<UserWithRole>>(
      "/users/",
      {
        method: "GET",
      },
      params
    );
  }

  async updateUser(
    id: string,
    payload: UpdateUserRequest
  ): Promise<ApiResponse<UserWithRole>> {
    // Updated to point to the new users endpoint logic
    return this.request<UserWithRole>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/users/${id}`, {
      method: "DELETE",
    });
  }

  async reactivateUser(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/users/${id}/reactivate`, {
      method: "POST",
    });
  }

  // Medics
  async getMedics(): Promise<
    ApiResponse<{ resident: DoctorWithId[]; supervisor: DoctorWithId[] }>
  > {
    return this.request<{
      resident: DoctorWithId[];
      supervisor: DoctorWithId[];
    }>("/doctors/get-doctors");
  }

  // Patients
  async getPatients(params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<PatientWithId>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.page_size) queryParams.append("page_size", params.page_size.toString());
    if (params?.search) queryParams.append("search", params.search);

    const url = `/patients/patients${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return this.request<PaginatedResponse<PatientWithId>>(url);
  }

  async getPatient(id: string): Promise<ApiResponse<PatientWithId>> {
    return this.request<PatientWithId>(`/patients/${id}`);
  }

  async createPatient(
    payload: CreatePatientRequest
  ): Promise<ApiResponse<PatientWithId>> {
    return this.request<PatientWithId>("/patients/patients", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updatePatient(
    id: string,
    payload: UpdatePatientRequest
  ): Promise<ApiResponse<PatientWithId>> {
    return this.request<PatientWithId>(`/patients/patients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  // Clinical Attentions
  async getClinicalAttentions(params?: {
    page?: number;
    page_size?: number;
    patient_search?: string;
    doctor_search?: string;
    medic_approved?: string;
    supervisor_approved?: string;
  }): Promise<ApiResponse<PaginatedResponse<ClinicalAttention>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.page_size) queryParams.append("page_size", params.page_size.toString());
    if (params?.patient_search) queryParams.append("patient_search", params.patient_search);
    if (params?.doctor_search) queryParams.append("doctor_search", params.doctor_search);
    if (params?.medic_approved) queryParams.append("medic_approved", params.medic_approved);
    if (params?.supervisor_approved) queryParams.append("supervisor_approved", params.supervisor_approved);

    const url = `/clinical_attentions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return this.request<PaginatedResponse<ClinicalAttention>>(url);
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

  async getClinicalAttentionHistory(
    payload: ClinicalAttentionHistoryRequest
  ): Promise<ApiResponse<ClinicalAttentionHistoryResponse>> {
    return this.request<ClinicalAttentionHistoryResponse>(
      "/clinical_attentions/history",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  // Insurance Companies
  async getInsuranceCompanies(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    order?: string;
  }): Promise<ApiResponse<PaginatedResponse<InsuranceCompany>>> {
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

  async uploadInsuranceExcel(
    insurance_company_id: number,
    file: File
  ): Promise<ApiResponse<{ updated: number }>> {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${this.baseUrl}/clinical_attentions/import_insurance_excel?insurance_company_id=${insurance_company_id}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // Try to get error details from response body
        let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorDetail = errorData.detail;
          }
        } catch {
          // If JSON parsing fails, use the default error
        }

        return {
          success: false,
          error: errorDetail,
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
      };
    }
  }

  // Metrics
  async getAllUsersMetrics(
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<MetricStats[]>> {
    const params: QueryParams = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    return this.request<MetricStats[]>("/metrics/users", {}, params);
  }

  async getUserMetrics(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<MetricStats>> {
    const params: QueryParams = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    return this.request<MetricStats>(`/metrics/users/${userId}`, {}, params);
  }

  async getInsuranceMetrics(
    companyId: number,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<MetricStats>> {
    const params: QueryParams = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    return this.request<MetricStats>(
      `/metrics/insurance_companies/${companyId}`,
      {},
      params
    );
  }
}

export const apiClient = new ApiClient();

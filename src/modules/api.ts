import { API_URL } from "astro:env/client";
import type { ApiResponse, ClinicalAttention, CreateClinicalAttentionRequest, PaginatedResponse, UpdateClinicalAttentionRequest } from "./types";

type QueryParams = Record<string, string | number | boolean | undefined>;

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL || "http://localhost:3000/v1";
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
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Handle empty responses (like DELETE 204 No Content)
      const contentType = response.headers.get("content-type");
      if (response.status === 204 || !contentType?.includes("application/json")) {
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

  // clinical attentions endpoints

  async getClinicalAttentions(
    pagination?: { page?: number; page_size?: number }
  ): Promise<ApiResponse<PaginatedResponse<ClinicalAttention>>> {
    return this.request<PaginatedResponse<ClinicalAttention>>("/clinical_attentions", {}, pagination);
  }

  async createClinicalAttention(clinicalAttention: CreateClinicalAttentionRequest): Promise<ApiResponse<ClinicalAttention>> {
    return this.request<ClinicalAttention>("/clinical_attentions", {
      method: "POST",
      body: JSON.stringify(clinicalAttention),
    });
  }

  async getClinicalAttention(id: string): Promise<ApiResponse<ClinicalAttention>> {
    return this.request<ClinicalAttention>(`/clinical_attentions/${id}`);
  }

  async updateClinicalAttention(id: string, clinicalAttention: UpdateClinicalAttentionRequest): Promise<ApiResponse<ClinicalAttention>> {
    return this.request<ClinicalAttention>(`/clinical_attentions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(clinicalAttention),
    });
  }

  async deleteClinicalAttention(id: string, deleted_by_id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/clinical_attentions/${id}`, { method: "DELETE", body: JSON.stringify({ deleted_by_id }) });
  }
}

export const apiClient = new ApiClient();
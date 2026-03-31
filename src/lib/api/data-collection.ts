import { apiFetchAuth } from "./client.js";
import type {
  CreateDataCollectionRequestPayload,
  DataCollectionRequestDetailResponseDto,
  DataCollectionRequestListResponse,
  DataCollectionRequestResponseDto,
} from "./types.js";

export async function listRequests(
  accessToken: string,
  params?: { status?: string; page?: number; pageSize?: number }
): Promise<DataCollectionRequestListResponse> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const query = qs.toString();

  return apiFetchAuth<DataCollectionRequestListResponse>(
    `/data-collection/requests${query ? `?${query}` : ""}`,
    accessToken
  );
}

export async function getRequest(
  accessToken: string,
  id: string
): Promise<DataCollectionRequestDetailResponseDto> {
  return apiFetchAuth<DataCollectionRequestDetailResponseDto>(
    `/data-collection/requests/${id}`,
    accessToken
  );
}

export async function createRequest(
  accessToken: string,
  data: CreateDataCollectionRequestPayload
): Promise<DataCollectionRequestDetailResponseDto> {
  return apiFetchAuth<DataCollectionRequestDetailResponseDto>(
    "/data-collection/requests",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function cancelRequest(
  accessToken: string,
  id: string
): Promise<DataCollectionRequestResponseDto> {
  return apiFetchAuth<DataCollectionRequestResponseDto>(
    `/data-collection/requests/${id}`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
    }
  );
}

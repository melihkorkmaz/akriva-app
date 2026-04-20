import { apiFetchAuth } from "./client.js";
import type {
  CreateDataCollectionRequestPayload,
  DataCollectionRequestDetailResponseDto,
  DataCollectionRequestListResponse,
  DataCollectionRequestResponseDto,
  DataCollectionTaskListResponse,
  DataCollectionTaskResponseDto,
  UpdateDataCollectionTaskPayload,
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

// ── Data Collection Tasks ──

export async function listTasks(
  accessToken: string,
  params?: {
    requestId?: string;
    status?: string;
    orgUnitId?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<DataCollectionTaskListResponse> {
  const qs = new URLSearchParams();
  if (params?.requestId) qs.set("requestId", params.requestId);
  if (params?.status) qs.set("status", params.status);
  if (params?.orgUnitId) qs.set("orgUnitId", params.orgUnitId);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const query = qs.toString();

  return apiFetchAuth<DataCollectionTaskListResponse>(
    `/data-collection/tasks${query ? `?${query}` : ""}`,
    accessToken
  );
}

export async function getTask(
  accessToken: string,
  id: string
): Promise<DataCollectionTaskResponseDto> {
  return apiFetchAuth<DataCollectionTaskResponseDto>(
    `/data-collection/tasks/${id}`,
    accessToken
  );
}

export async function updateTask(
  accessToken: string,
  id: string,
  data: UpdateDataCollectionTaskPayload
): Promise<DataCollectionTaskResponseDto> {
  return apiFetchAuth<DataCollectionTaskResponseDto>(
    `/data-collection/tasks/${id}`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export async function listActivityUnits(
  accessToken: string,
  orgUnitId: string,
  category: string
): Promise<string[]> {
  const qs = new URLSearchParams({ orgUnitId, category });
  return apiFetchAuth<string[]>(
    `/emission/activity-units?${qs}`,
    accessToken
  );
}

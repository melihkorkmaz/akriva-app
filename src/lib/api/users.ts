import { apiFetchAuth } from "./client";
import type {
  UserMeResponseDto,
  UserResponseDto,
  UserListResponse,
  AssignmentResponseDto,
  TenantRole,
} from "./types";

/** Query params for GET /v1/users */
export interface FetchUsersParams {
  role?: TenantRole;
  search?: string;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}

/** GET /v1/users/me */
export async function fetchCurrentUser(
  accessToken: string
): Promise<UserMeResponseDto> {
  return apiFetchAuth<UserMeResponseDto>("/users/me", accessToken);
}

/** GET /v1/users */
export async function fetchUsers(
  accessToken: string,
  params?: FetchUsersParams
): Promise<UserListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.role) searchParams.set("role", params.role);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.includeInactive) searchParams.set("includeInactive", "true");
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));

  const query = searchParams.toString();
  return apiFetchAuth<UserListResponse>(
    `/users/${query ? `?${query}` : ""}`,
    accessToken
  );
}

/** PATCH /v1/users/profile */
export async function updateProfile(
  accessToken: string,
  data: { displayName: string }
): Promise<UserResponseDto> {
  return apiFetchAuth<UserResponseDto>("/users/profile", accessToken, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** PATCH /v1/users/{userId}/role */
export async function updateUserRole(
  accessToken: string,
  userId: string,
  role: TenantRole
): Promise<UserResponseDto> {
  return apiFetchAuth<UserResponseDto>(`/users/${userId}/role`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

/** DELETE /v1/users/{userId} — soft delete (deactivate) */
export async function deactivateUser(
  accessToken: string,
  userId: string
): Promise<UserResponseDto> {
  return apiFetchAuth<UserResponseDto>(`/users/${userId}`, accessToken, {
    method: "DELETE",
  });
}

/** GET /v1/users/{userId}/assignments */
export async function fetchAssignments(
  accessToken: string,
  userId: string
): Promise<AssignmentResponseDto[]> {
  return apiFetchAuth<AssignmentResponseDto[]>(
    `/users/${userId}/assignments`,
    accessToken
  );
}

/** PUT /v1/users/{userId}/assignments — full replace */
export async function replaceAssignments(
  accessToken: string,
  userId: string,
  orgUnitIds: string[]
): Promise<AssignmentResponseDto[]> {
  return apiFetchAuth<AssignmentResponseDto[]>(
    `/users/${userId}/assignments`,
    accessToken,
    {
      method: "PUT",
      body: JSON.stringify({ orgUnitIds }),
    }
  );
}

/** POST /v1/users/{userId}/assignments — add single */
export async function addAssignment(
  accessToken: string,
  userId: string,
  orgUnitId: string
): Promise<AssignmentResponseDto> {
  return apiFetchAuth<AssignmentResponseDto>(
    `/users/${userId}/assignments`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ orgUnitId }),
    }
  );
}

/** DELETE /v1/users/{userId}/assignments/{orgUnitId} — remove single */
export async function removeAssignment(
  accessToken: string,
  userId: string,
  orgUnitId: string
): Promise<void> {
  await apiFetchAuth<void>(
    `/users/${userId}/assignments/${orgUnitId}`,
    accessToken,
    {
      method: "DELETE",
    }
  );
}

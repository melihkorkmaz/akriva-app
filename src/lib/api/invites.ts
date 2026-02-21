import { apiFetch, apiFetchAuth } from "./client";
import type {
  InviteResponseDto,
  InviteListResponse,
  InviteStatus,
  TenantRole,
  ValidateInviteTokenResponseDto,
} from "./types";

/** Query params for GET /v1/users/invites */
export interface FetchInvitesParams {
  status?: InviteStatus;
  email?: string;
  limit?: number;
  offset?: number;
}

/** POST /v1/users/invites */
export async function createInvite(
  accessToken: string,
  data: { email: string; role: TenantRole; expiresInDays?: number }
): Promise<InviteResponseDto> {
  return apiFetchAuth<InviteResponseDto>("/users/invites", accessToken, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** GET /v1/users/invites */
export async function fetchInvites(
  accessToken: string,
  params?: FetchInvitesParams
): Promise<InviteListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.email) searchParams.set("email", params.email);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));

  const query = searchParams.toString();
  return apiFetchAuth<InviteListResponse>(
    `/users/invites${query ? `?${query}` : ""}`,
    accessToken
  );
}

/** DELETE /v1/users/invites/{inviteId} — revoke */
export async function revokeInvite(
  accessToken: string,
  inviteId: string
): Promise<InviteResponseDto> {
  return apiFetchAuth<InviteResponseDto>(
    `/users/invites/${inviteId}`,
    accessToken,
    {
      method: "DELETE",
    }
  );
}

/** GET /v1/auth/invites/{token}/validate (public — no auth) */
export async function validateInviteToken(
  token: string
): Promise<ValidateInviteTokenResponseDto> {
  return apiFetch<ValidateInviteTokenResponseDto>(
    `/auth/invites/${token}/validate`
  );
}

import { apiFetchAuth } from "./client.js";
import type {
  OrgUnitResponseDto,
  OrgUnitTreeListResponseDto,
  CreateOrgUnitRequest,
  UpdateOrgUnitRequest,
  MoveOrgUnitRequest,
} from "./types.js";

/** GET /v1/org-units?view=tree */
export async function getOrgUnitsTree(
  accessToken: string
): Promise<OrgUnitTreeListResponseDto> {
  return apiFetchAuth<OrgUnitTreeListResponseDto>(
    "/org-units/?view=tree",
    accessToken
  );
}

/** POST /v1/org-units */
export async function createOrgUnit(
  accessToken: string,
  data: CreateOrgUnitRequest
): Promise<OrgUnitResponseDto> {
  return apiFetchAuth<OrgUnitResponseDto>("/org-units/", accessToken, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PATCH /v1/org-units/{id} */
export async function updateOrgUnit(
  accessToken: string,
  id: string,
  data: UpdateOrgUnitRequest
): Promise<OrgUnitResponseDto> {
  return apiFetchAuth<OrgUnitResponseDto>(`/org-units/${id}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** DELETE /v1/org-units/{id} */
export async function deleteOrgUnit(
  accessToken: string,
  id: string
): Promise<OrgUnitResponseDto> {
  return apiFetchAuth<OrgUnitResponseDto>(`/org-units/${id}`, accessToken, {
    method: "DELETE",
  });
}

/** PATCH /v1/org-units/{id}/move */
export async function moveOrgUnit(
  accessToken: string,
  id: string,
  data: MoveOrgUnitRequest
): Promise<OrgUnitResponseDto> {
  return apiFetchAuth<OrgUnitResponseDto>(
    `/org-units/${id}/move`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

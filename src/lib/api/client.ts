import type { ApiErrorResponse } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.akriva.com/v1";

/** Custom error class for API errors */
export class ApiError extends Error {
  constructor(public status: number, public body: ApiErrorResponse) {
    super(body.error);
    this.name = "ApiError";
  }
}

/** Generic fetch wrapper with error handling */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  console.log(
    `API Request: ${options.method || "GET"} ${url}`,
    response.status
  );
  if (response.status >= 400) {
    console.log(`API Request: ${options.method || "GET"} ${url}`);
    console.log("Request options:", options);
    console.log("API Response status:", response);
    console.log("API Response body:", await response.clone().text());
  }

  if (!response.ok) {
    const errorBody = (await response.json()) as ApiErrorResponse;
    throw new ApiError(response.status, errorBody);
  }

  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/** Authenticated fetch wrapper — injects Bearer token */
export async function apiFetchAuth<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const res = await apiFetch<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return res;
  } catch (error) {
    console.error("API request failed:", error);
    return Promise.reject(error);
  }
}

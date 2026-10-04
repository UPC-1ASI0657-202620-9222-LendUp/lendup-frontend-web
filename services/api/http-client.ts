import { appConfig } from '@/config/app-config';
import { authService } from '@/services/auth/auth.service';
import type { Endpoint } from '@/services/api/endpoints';

export type DomainErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly retryable: boolean;
  readonly status: number;
  readonly serverCode?: string;
  readonly fieldErrors?: Record<string, string>;
  constructor(
    code: DomainErrorCode,
    options: {
      status?: number;
      retryable?: boolean;
      fieldErrors?: Record<string, string>;
      message?: string;
      serverCode?: string;
    } = {},
  ) {
    super(options.message ?? code);
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.status = options.status ?? 0;
    this.serverCode = options.serverCode;
    this.fieldErrors = options.fieldErrors;
  }
}

type Query = Record<string, string | number | undefined>;

function buildUrl(
  endpoint: Endpoint,
  params: Record<string, string> = {},
  query: Query = {},
) {
  const baseUrl = appConfig.apiGatewayUrl.replace(/\/+$/, '');
  const path = endpoint.path.replace(/\{(\w+)\}/g, (_, name: string) =>
    encodeURIComponent(params[name] ?? ''),
  );
  const search = new URLSearchParams(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)]),
  ).toString();
  return `${baseUrl}${path}${search ? `?${search}` : ''}`;
}

export async function gatewayRequest<T>(
  endpoint: Endpoint,
  options: {
    params?: Record<string, string>;
    query?: Query;
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const token = await authService.idToken();
  let response: Response;
  try {
    response = await fetch(buildUrl(endpoint, options.params, options.query), {
      method: endpoint.method,
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch {
    throw new DomainError('NETWORK_ERROR', { retryable: true });
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      fieldErrors?: Record<string, string>;
    };
    const code: DomainErrorCode =
      response.status === 400
        ? 'BAD_REQUEST'
        : response.status === 401
          ? 'UNAUTHENTICATED'
          : response.status === 403
            ? 'FORBIDDEN'
            : response.status === 404
              ? 'NOT_FOUND'
              : response.status === 409
                ? 'CONFLICT'
                : response.status === 422
                  ? 'VALIDATION_ERROR'
                  : response.status >= 500
                    ? 'SERVER_ERROR'
                    : 'UNKNOWN';
    if (response.status === 401)
      await authService.logout().catch(() => undefined);
    throw new DomainError(code, {
      status: response.status,
      retryable: response.status >= 500,
      fieldErrors: payload.fieldErrors,
      message: payload.message,
      serverCode: payload.error,
    });
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

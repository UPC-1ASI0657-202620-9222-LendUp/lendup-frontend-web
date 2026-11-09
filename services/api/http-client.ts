import { appConfig } from '@/config/app-config';
import { authService } from '@/services/auth/auth.service';
import type { Endpoint } from '@/services/api/endpoints';
import { resolveApiRequest } from '@/services/api/request-routing';

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
  const route = resolveApiRequest(endpoint, {
    renderUrl: appConfig.renderApiGatewayUrl,
    awsUrl: appConfig.awsApiGatewayUrl,
  });
  const path = route.path.replace(/\{(\w+)\}/g, (_, name: string) =>
    encodeURIComponent(params[name] ?? ''),
  );
  const search = new URLSearchParams(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)]),
  ).toString();
  return { url: `${route.baseUrl}${path}${search ? `?${search}` : ''}`, method: route.method };
}

export async function gatewayRequest<T>(
  endpoint: Endpoint,
  options: {
    params?: Record<string, string>;
    query?: Query;
    body?: unknown;
    signal?: AbortSignal;
    public?: boolean;
  } = {},
): Promise<T> {
  const token = options.public ? null : await authService.idToken();
  let response: Response;
  try {
    const request = buildUrl(endpoint, options.params, options.query);
    response = await fetch(request.url, {
      method: request.method,
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined && !(options.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body:
        options.body instanceof FormData
          ? options.body
          : options.body !== undefined
            ? JSON.stringify(options.body)
            : undefined,
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
      codigo?: string;
      mensaje?: string;
      campos?: Record<string, string>;
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
    if (response.status === 401 && !options.public)
      await authService.logout().catch(() => undefined);
    throw new DomainError(code, {
      status: response.status,
      retryable: response.status >= 500,
      fieldErrors: payload.fieldErrors ?? payload.campos,
      message: payload.message ?? payload.mensaje,
      serverCode: payload.error ?? payload.codigo,
    });
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

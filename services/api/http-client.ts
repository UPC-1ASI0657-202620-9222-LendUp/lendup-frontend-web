import { appConfig } from '@/config/app-config';
import { authProvider } from '@/services/adapters/firebase-auth';
import type { Endpoint } from '@/services/api/endpoints';

export type DomainErrorCode =
  | 'FORBIDDEN'
  | 'NOT_PARTICIPANT'
  | 'INVALID_STATE_TRANSITION'
  | 'LISTING_NOT_AVAILABLE'
  | 'OVERLAPPING_RESERVATION'
  | 'PAYMENT_REQUIRED'
  | 'GUARANTEE_REQUIRED'
  | 'EXTENSION_PAYMENT_REQUIRED'
  | 'INCIDENT_PENDING'
  | 'PAYMENT_PROVIDER_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly retryable: boolean;
  readonly fieldErrors?: Record<string, string>;
  constructor(
    code: DomainErrorCode,
    options: { retryable?: boolean; fieldErrors?: Record<string, string> } = {},
  ) {
    super(code);
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.fieldErrors = options.fieldErrors;
  }
}

type Query = Record<string, string | number | undefined>;

function buildUrl(
  endpoint: Endpoint,
  params: Record<string, string> = {},
  query: Query = {},
) {
  const path = endpoint.path.replace(/\{(\w+)\}/g, (_, name: string) =>
    encodeURIComponent(params[name] ?? ''),
  );
  const search = new URLSearchParams(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)]),
  ).toString();
  return `${appConfig.apiGatewayUrl}${path}${search ? `?${search}` : ''}`;
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
  const token = await authProvider.getIdToken();
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
      code?: DomainErrorCode;
      retryable?: boolean;
      fieldErrors?: Record<string, string>;
    };
    throw new DomainError(payload.code ?? 'UNKNOWN', {
      retryable: payload.retryable ?? response.status >= 500,
      fieldErrors: payload.fieldErrors,
    });
  }
  return (await response.json()) as T;
}

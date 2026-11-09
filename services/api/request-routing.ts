/**
 * Enrutamiento híbrido del frontend. Render conserva las rutas del monolito;
 * AWS sirve los seis bounded contexts migrados a través de Spring Cloud Gateway.
 * No se reintentan escrituras contra otro proveedor después de un error.
 */
export type ApiEndpoint = { method: string; path: string };
export type ApiOrigins = { renderUrl: string; awsUrl?: string };

const catalogRoutes: Readonly<Record<string, { method?: string; path: string }>> = {
  'GET /objetos': { path: '/catalogo/publicaciones' },
  'POST /objetos': { path: '/catalogo/publicaciones' },
  'GET /objetos/{id}': { path: '/catalogo/publicaciones/{id}' },
  'PUT /objetos/{id}': { method: 'PATCH', path: '/catalogo/publicaciones/{id}' },
  'PATCH /objetos/{id}/estado': { path: '/catalogo/publicaciones/{id}/estado' },
  'GET /objetos/{id}/disponibilidad': { path: '/catalogo/publicaciones/{id}/disponibilidades' },
  'PUT /objetos/{id}/disponibilidad': { method: 'POST', path: '/catalogo/publicaciones/{id}/disponibilidades' },
  'PUT /objetos/{id}/disponibilidad/{slotId}': { path: '/catalogo/publicaciones/{id}/disponibilidades/{slotId}' },
  'DELETE /objetos/{id}/disponibilidad/{slotId}': { path: '/catalogo/publicaciones/{id}/disponibilidades/{slotId}' },
  'POST /objetos/{id}/imagenes': { path: '/catalogo/publicaciones/{id}/imagenes' },
  'DELETE /objetos/{id}/imagenes/{imageId}': { path: '/catalogo/publicaciones/{id}/imagenes/{imageId}' },
};

function isAwsGatewayRoute(path: string): boolean {
  return /^\/(?:estudiantes|universidades|solicitudes|reservas|medios-pago|pagos|garantias|notificaciones)(?:\/|$)/.test(path)
    || path === '/webhooks/mercado-pago'
    || /^\/prestamos\/\{id\}\/(?:transacciones|calificaciones)$/.test(path);
}

function normalizeAwsUrl(value: string): string {
  const url = new URL(value);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new Error('VITE_AWS_API_GATEWAY_URL debe ser HTTPS (HTTP solo en localhost).');
  }
  const normalized = value.replace(/\/+$/, '');
  if (!url.pathname.replace(/\/+$/, '').endsWith('/api/v1')) {
    throw new Error('VITE_AWS_API_GATEWAY_URL debe incluir /api/v1.');
  }
  return normalized;
}

export function isAwsCatalogEnabled(awsUrl?: string): boolean {
  return Boolean(awsUrl?.trim());
}

export function resolveApiRequest(endpoint: ApiEndpoint, origins: ApiOrigins) {
  const catalog = catalogRoutes[`${endpoint.method} ${endpoint.path}`];
  const awsUrl = origins.awsUrl?.trim();
  const aws = Boolean(awsUrl && (catalog || isAwsGatewayRoute(endpoint.path)));
  return {
    provider: aws ? 'aws' as const : 'render' as const,
    baseUrl: aws ? normalizeAwsUrl(awsUrl!) : origins.renderUrl.replace(/\/+$/, ''),
    method: aws && catalog?.method ? catalog.method : endpoint.method,
    path: aws && catalog ? catalog.path : endpoint.path,
  };
}

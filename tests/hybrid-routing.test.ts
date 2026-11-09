import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isAwsCatalogEnabled, resolveApiRequest } from '../services/api/request-routing.ts';

const renderUrl = 'https://lendup-backend.onrender.com/api/v1';
const awsUrl = 'https://api.lendup.example/api/v1';
const route = (method: string, path: string, enableAws = true) =>
  resolveApiRequest({ method, path }, { renderUrl, awsUrl: enableAws ? awsUrl : '' });

describe('Enrutamiento híbrido Render / AWS', () => {
  it('conserva íntegramente Render si AWS no ha sido habilitado', () => {
    assert.deepEqual(route('GET', '/objetos', false), {
      provider: 'render', baseUrl: renderUrl, method: 'GET', path: '/objetos',
    });
    assert.equal(route('GET', '/medios-pago', false).baseUrl, renderUrl);
    assert.equal(isAwsCatalogEnabled(''), false);
  });

  it('enruta los seis contextos migrados a AWS', () => {
    for (const path of [
      '/estudiantes/me',
      '/universidades',
      '/catalogo/publicaciones',
      '/solicitudes',
      '/reservas',
      '/medios-pago',
      '/pagos',
      '/garantias',
      '/notificaciones',
      '/estudiantes/{id}/reputacion',
      '/prestamos/{id}/transacciones',
      '/prestamos/{id}/calificaciones',
    ]) {
      // Catalogo usa el traductor de rutas cuando el cliente envía /objetos.
      if (path.startsWith('/catalogo/')) continue;
      assert.equal(route('GET', path).provider, 'aws', path);
    }
    assert.equal(isAwsCatalogEnabled(awsUrl), true);
  });

  it('traduce el contrato de catálogo al de ASP.NET Core', () => {
    assert.deepEqual(route('GET', '/objetos'), {
      provider: 'aws', baseUrl: awsUrl, method: 'GET', path: '/catalogo/publicaciones',
    });
    assert.equal(route('POST', '/objetos').path, '/catalogo/publicaciones');
    assert.equal(route('PUT', '/objetos/{id}').method, 'PATCH');
    assert.equal(route('PUT', '/objetos/{id}/disponibilidad').method, 'POST');
    assert.equal(route('PUT', '/objetos/{id}/disponibilidad').path,
      '/catalogo/publicaciones/{id}/disponibilidades');
  });

  it('conserva préstamos, evidencias, incidencias y términos en Render', () => {
    for (const path of [
      '/prestamos/{id}/entrega',
      '/prestamos/{id}/evidencias',
      '/incidencias',
      '/admin/incidencias',
      '/calendario',
      '/terminos',
    ]) {
      assert.equal(route('POST', path).provider, 'render', path);
    }
  });

  it('rechaza AWS sin TLS excepto localhost', () => {
    assert.throws(() => resolveApiRequest(
      { method: 'GET', path: '/medios-pago' },
      { renderUrl, awsUrl: 'http://100.48.16.62:8090/api/v1' },
    ), /HTTPS/);
    assert.equal(resolveApiRequest(
      { method: 'GET', path: '/medios-pago' },
      { renderUrl, awsUrl: 'http://localhost:8090/api/v1' },
    ).provider, 'aws');
    assert.throws(() => resolveApiRequest(
      { method: 'GET', path: '/medios-pago' },
      { renderUrl, awsUrl: 'https://api.lendup.example' },
    ), /api\/v1/);
  });
});

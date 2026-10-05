import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  categories,
  categoryCodeForId,
  categoryIds,
} from '../config/reference-data.ts';
import { toCatalogQuery } from '../lib/catalog-filters.ts';

const filters = {
  query: '  cámara científica  ',
  category: 'CAMERAS' as const,
  universityId: 'UPC',
  campus: ' Monterrico ',
  location: ' Santiago de Surco ',
  from: '2026-10-06T12:00',
  to: '2026-10-08T12:00',
};

describe('Filtros del catálogo', () => {
  it('envía todos los filtros usando el identificador real de categoría', () => {
    assert.deepEqual(toCatalogQuery(filters), {
      nombre: 'cámara científica',
      categoria: categoryIds.CAMERAS,
      universidad: 'UPC',
      campus: 'Monterrico',
      ubicacion: 'Santiago de Surco',
      desde: '2026-10-06T12:00',
      hasta: '2026-10-08T12:00',
    });
  });

  it('no aplica fechas hasta tener un periodo completo y válido', () => {
    assert.equal(toCatalogQuery({ ...filters, to: '' }).desde, undefined);
    assert.equal(toCatalogQuery({ ...filters, to: '' }).hasta, undefined);
    assert.equal(
      toCatalogQuery({
        ...filters,
        from: '2026-10-08T12:00',
        to: '2026-10-06T12:00',
      }).desde,
      undefined,
    );
  });

  it('mantiene una correspondencia reversible para todas las categorías', () => {
    assert.equal(categories.length, 6);
    for (const category of categories)
      assert.equal(categoryCodeForId(categoryIds[category]), category);
  });
});

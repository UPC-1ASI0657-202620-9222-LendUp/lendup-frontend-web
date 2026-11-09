import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { awsCategoryIds, categoryCodeForId, categoryIds } from '../config/reference-data.ts';
import { fromAwsPublication, toAwsCatalogQuery, toAwsPublicationBody } from '../services/api/catalog-compat.ts';

describe('Adaptador del microservicio Catálogo', () => {
  it('traduce categorías del monolito a los UUID sembrados en AWS', () => {
    for (const code of Object.keys(categoryIds) as (keyof typeof categoryIds)[]) {
      assert.equal(categoryCodeForId(awsCategoryIds[code]), code);
      assert.equal(categoryCodeForId(categoryIds[code]), code);
    }
  });

  it('transforma filtros y cuerpo de creación al contrato .NET', () => {
    assert.deepEqual(toAwsCatalogQuery({
      nombre: 'Cámara', categoria: categoryIds.CAMERAS, ubicacion: 'Surco',
    }), {
      nombre: 'Cámara',
      categoriaId: awsCategoryIds.CAMERAS,
    });
    assert.deepEqual(toAwsPublicationBody({
      categoria_id: categoryIds.CAMERAS, titulo: 'Cámara', descripcion: 'Foto',
      condicion_objeto: 'GOOD', universidad: 'UPC', campus: 'Monterrico',
      ubicacion: 'Surco', tarifa_diaria: 20, garantia_monetaria: 50,
      moneda: 'PEN', lugar_intercambio: 'Campus',
      condiciones_uso: 'Cuidar', condiciones_entrega: 'En mano',
      condiciones_devolucion: 'En mano', condiciones_cancelacion: 'Avisar',
    }), {
      detalles: {
        categoriaId: awsCategoryIds.CAMERAS, titulo: 'Cámara',
        descripcion: 'Foto', condicionObjeto: 'GOOD',
        universidad: 'UPC', campus: 'Monterrico', ubicacion: 'Surco',
      },
      condiciones: {
        lugarIntercambio: 'Campus', tarifaDiaria: 20, garantiaMonetaria: 50,
        moneda: 'PEN', condicionesUso: 'Cuidar',
        condicionesEntrega: 'En mano', condicionesDevolucion: 'En mano',
        condicionesCancelacion: 'Avisar',
      },
    });
  });

  it('transforma un PATCH parcial sin inventar valores de campos ausentes', () => {
    assert.deepEqual(toAwsPublicationBody({ titulo: 'Nuevo título', moneda: 'PEN' }), {
      detalles: { titulo: 'Nuevo título' }, condiciones: { moneda: 'PEN' },
    });
  });

  it('normaliza la respuesta anidada de AWS al mapper existente', () => {
    const publication = fromAwsPublication({
      id: 'abc',
      propietarioUsuarioId: 'owner',
      detalles: {
        titulo: 'Calculadora', descripcion: 'Científica',
        categoriaId: awsCategoryIds.CALCULATORS, condicionObjeto: 'GOOD',
        universidad: 'UPC', campus: 'Monterrico', ubicacion: 'Campus',
      },
      condiciones: { tarifaDiaria: 12, garantiaMonetaria: 30,
        lugarIntercambio: 'Biblioteca', condicionesUso: 'Cuidar' },
      estado: 'ACTIVA',
      disponibilidades: [{ id: 'x1', desde: '2026-11-10T08:00:00', hasta: '2026-11-11T08:00:00' }],
    });
    assert.equal(publication.propietario_usuario_id, 'owner');
    assert.equal(publication.categoria_id, awsCategoryIds.CALCULATORS);
    assert.equal(publication.tarifa_diaria, 12);
    assert.deepEqual(publication.disponibilidades,
      [{ id: 'x1', desde: '2026-11-10T08:00:00', hasta: '2026-11-11T08:00:00' }]);
  });
});

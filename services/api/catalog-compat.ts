/**
 * Adaptadores de contrato entre el monolito Render (snake_case plano)
 * y Catálogo .NET en AWS (detalles/condiciones anidados en camelCase).
 * No se inventan propiedades que el microservicio aún no devuelve.
 */
import { awsCategoryIds, categoryCodeForId } from '../../config/reference-data.ts';
import type { BackendRow, CreatePublicationRequestDto } from './dto/backend.ts';

const asRow = (value: unknown): BackendRow =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as BackendRow
    : {};

export function toAwsPublicationBody(body: Partial<CreatePublicationRequestDto>) {
  const detalles: BackendRow = {};
  const condiciones: BackendRow = {};
  const detailFields: Record<string, string> = {
    titulo: 'titulo',
    descripcion: 'descripcion',
    condicion_objeto: 'condicionObjeto',
    universidad: 'universidad',
    campus: 'campus',
    ubicacion: 'ubicacion',
  };
  const termFields: Record<string, string> = {
    lugar_intercambio: 'lugarIntercambio',
    tarifa_diaria: 'tarifaDiaria',
    garantia_monetaria: 'garantiaMonetaria',
    moneda: 'moneda',
    condiciones_uso: 'condicionesUso',
    condiciones_entrega: 'condicionesEntrega',
    condiciones_devolucion: 'condicionesDevolucion',
    condiciones_cancelacion: 'condicionesCancelacion',
  };
  if (body.categoria_id !== undefined) {
    detalles.categoriaId = awsCategoryIds[categoryCodeForId(body.categoria_id)];
  }
  for (const [source, target] of Object.entries(detailFields)) {
    const value = body[source as keyof CreatePublicationRequestDto];
    if (value !== undefined) detalles[target] = value;
  }
  for (const [source, target] of Object.entries(termFields)) {
    const value = body[source as keyof CreatePublicationRequestDto];
    if (value !== undefined) condiciones[target] = value;
  }
  return {
    ...(Object.keys(detalles).length ? { detalles } : {}),
    ...(Object.keys(condiciones).length ? { condiciones } : {}),
  };
}

export function toAwsCatalogQuery(query: Record<string, string | undefined>) {
  const { categoria, ubicacion, ...rest } = query;
  return {
    ...rest,
    categoriaId: categoria
      ? awsCategoryIds[categoryCodeForId(categoria)]
      : undefined,
    // La API de AWS todavía no implementa el filtro ubicacion.
  };
}

export function fromAwsPublication(raw: BackendRow): BackendRow {
  const d = asRow(raw.detalles);
  const c = asRow(raw.condiciones);
  const slots = Array.isArray(raw.disponibilidades)
    ? raw.disponibilidades.map((item) => {
        const slot = asRow(item);
        return {
          id: slot.id,
          desde: slot.desde,
          hasta: slot.hasta,
        };
      })
    : [];
  return {
    id: raw.id,
    propietario_usuario_id: raw.propietarioUsuarioId,
    titulo: d.titulo,
    descripcion: d.descripcion,
    categoria_id: d.categoriaId,
    condicion_objeto: d.condicionObjeto,
    universidad: d.universidad,
    campus: d.campus,
    ubicacion: d.ubicacion,
    lugar_intercambio: c.lugarIntercambio,
    tarifa_diaria: c.tarifaDiaria,
    garantia_monetaria: c.garantiaMonetaria,
    estado: raw.estado,
    condiciones_uso: c.condicionesUso,
    condiciones_entrega: c.condicionesEntrega,
    condiciones_devolucion: c.condicionesDevolucion,
    condiciones_cancelacion: c.condicionesCancelacion,
    disponibilidades: slots,
    // Las imágenes se consultan mediante otro endpoint en el microservicio.
    imagenes: [],
  };
}

export type BackendRow = Record<string, unknown>;

export interface CurrentStudentDto {
  usuario: BackendRow;
  perfil: BackendRow;
}

export interface BackendErrorDto {
  status?: number;
  error?: string;
  message?: string;
}

export interface CreateStudentRequestDto {
  correo_institucional: string;
  nombre: string;
  campus?: string;
  carrera: string;
  ciclo: number;
  telefono: string;
  foto_url?: string;
}

export interface PublicationDetailsDto {
  categoriaId: string;
  titulo: string;
  descripcion: string;
  condicionObjeto: string;
  universidad: string;
  campus: string;
  ubicacion: string;
  latitud?: number | null;
  longitud?: number | null;
}

export interface PublicationConditionsDto {
  tarifaDiaria: number;
  garantiaMonetaria?: number | null;
  moneda: string;
  lugarIntercambio: string;
  condicionesUso: string;
  condicionesEntrega: string;
  condicionesDevolucion: string;
  condicionesCancelacion: string;
}

// Catálogo usa camelCase y secciones anidadas (a diferencia del resto, snake_case).
export interface CreatePublicationRequestDto {
  detalles: PublicationDetailsDto;
  condiciones: PublicationConditionsDto;
}

export interface UpdatePublicationRequestDto {
  detalles?: Partial<PublicationDetailsDto>;
  condiciones?: Partial<PublicationConditionsDto>;
}

export interface TermsAcceptanceSnapshotDto {
  snapshot_id: string;
  snapshot_hash: string;
  aceptada: true;
}

export interface PublicationSnapshotDto {
  id: string;
  propietario_usuario_id: string;
  estado: string;
  periodo_ofrecido: boolean;
  snapshot_id: string;
  snapshot_hash: string;
  tarifa_diaria: number;
  garantia_monetaria: number | null;
  moneda: string;
  lugar_intercambio: string;
  condiciones_uso: string;
  condiciones_entrega: string;
  condiciones_devolucion: string;
  condiciones_cancelacion: string;
}

export interface TermsDocumentDto {
  titulo: string;
  version_terminos: string;
  version_descargo: string;
  publicado_en: string;
  idioma: string;
  contenido: string;
}

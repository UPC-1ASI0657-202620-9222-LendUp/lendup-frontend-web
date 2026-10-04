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
  universidad: string;
  campus: string;
  carrera: string;
  ciclo: number;
  telefono: string;
  foto_url?: string;
}

export interface CreatePublicationRequestDto {
  categoria_id: string;
  titulo: string;
  descripcion: string;
  condicion_objeto: string;
  universidad: string;
  campus: string;
  ubicacion: string;
  lugar_intercambio: string;
  tarifa_diaria: number;
  garantia_monetaria?: number;
  moneda: 'PEN';
  condiciones_uso: string;
  condiciones_entrega: string;
  condiciones_devolucion: string;
  condiciones_cancelacion: string;
}

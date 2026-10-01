export const endpoints = {
  identity: {
    register: { method: 'POST', path: '/estudiantes' },
    me: { method: 'GET', path: '/estudiantes/me' },
    updateMe: { method: 'PUT', path: '/estudiantes/me' },
    verification: { method: 'POST', path: '/estudiantes/me/verificacion' },
    acceptTerms: {
      method: 'POST',
      path: '/estudiantes/me/aceptacion-terminos',
    },
  },
  catalog: {
    create: { method: 'POST', path: '/objetos' },
    update: { method: 'PUT', path: '/objetos/{id}' },
    changeStatus: { method: 'PATCH', path: '/objetos/{id}/estado' },
    availability: { method: 'PUT', path: '/objetos/{id}/disponibilidad' },
    search: { method: 'GET', path: '/objetos' },
    detail: { method: 'GET', path: '/objetos/{id}' },
  },
  reservations: {
    createRequest: { method: 'POST', path: '/solicitudes' },
    acceptRequest: { method: 'POST', path: '/solicitudes/{id}/aceptacion' },
    rejectRequest: { method: 'POST', path: '/solicitudes/{id}/rechazo' },
    list: { method: 'GET', path: '/reservas' },
    cancel: { method: 'POST', path: '/reservas/{id}/cancelacion' },
    contact: { method: 'GET', path: '/reservas/{id}/contacto' },
  },
  loans: {
    delivery: { method: 'POST', path: '/prestamos/{id}/entrega' },
    receipt: { method: 'POST', path: '/prestamos/{id}/recepcion' },
    extensions: { method: 'POST', path: '/prestamos/{id}/extensiones' },
    extensionResponse: {
      method: 'POST',
      path: '/prestamos/{id}/extensiones/{extId}/respuesta',
    },
    reschedules: { method: 'POST', path: '/prestamos/{id}/reprogramaciones' },
    returnRecord: { method: 'POST', path: '/prestamos/{id}/devolucion' },
    returnConfirmation: {
      method: 'POST',
      path: '/prestamos/{id}/confirmacion-devolucion',
    },
    list: { method: 'GET', path: '/prestamos' },
    calendar: { method: 'GET', path: '/calendario' },
  },
  evidence: {
    upload: { method: 'POST', path: '/prestamos/{id}/evidencias' },
    analysis: { method: 'POST', path: '/prestamos/{id}/analisis-evidencias' },
    reportIncident: { method: 'POST', path: '/incidencias' },
    incident: { method: 'GET', path: '/incidencias/{id}' },
    adminIncidents: { method: 'GET', path: '/admin/incidencias' },
    adminResolution: {
      method: 'POST',
      path: '/admin/incidencias/{id}/resolucion',
    },
  },
  payments: {
    methods: { method: 'GET', path: '/medios-pago' },
    pay: { method: 'POST', path: '/pagos' },
    guarantee: { method: 'POST', path: '/garantias' },
    loanTransactions: { method: 'GET', path: '/prestamos/{id}/transacciones' },
  },
  reputation: {
    rate: { method: 'POST', path: '/prestamos/{id}/calificaciones' },
    profile: { method: 'GET', path: '/estudiantes/{id}/reputacion' },
  },
  notifications: {
    list: { method: 'GET', path: '/notificaciones' },
    markRead: { method: 'PATCH', path: '/notificaciones/{id}' },
  },
} as const;

type EndpointGroups = typeof endpoints;
export type Endpoint = {
  [G in keyof EndpointGroups]: EndpointGroups[G][keyof EndpointGroups[G]];
}[keyof EndpointGroups];

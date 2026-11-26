import {
  EMULATOR_URL,
  FIREBASE_PROJECT,
  GATEWAY_URL,
  testPassword,
} from './env';

const HOUR = 3_600_000;
/** Hora de negocio (America/Lima) sin zona, como la usa todo LendUp. */
export const lima = (ms: number) =>
  new Date(ms - 5 * HOUR).toISOString().slice(0, 19);

export type Person = {
  uid: string;
  email: string;
  name: string;
  phone: string;
};

export const emailOf = (uid: string) => `${uid}@upc.edu.pe`;

async function emulator(path: string, body: unknown, admin = false) {
  const response = await fetch(
    `${EMULATOR_URL}/identitytoolkit.googleapis.com/v1${path}${path.includes('?') ? '&' : '?'}key=emulador`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(admin ? { Authorization: 'Bearer owner' } : {}),
      },
      body: JSON.stringify(body),
    },
  );
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

const tokens = new Map<string, string>();
async function token(person: Person) {
  const cached = tokens.get(person.uid);
  if (cached) return cached;
  const result = await emulator('/accounts:signInWithPassword', {
    email: person.email,
    password: testPassword(),
    returnSecureToken: true,
  });
  const idToken = result.body.idToken;
  if (typeof idToken !== 'string')
    throw new Error(
      `El emulador no entregó token: ${JSON.stringify(result.body)}`,
    );
  tokens.set(person.uid, idToken);
  return idToken;
}

export async function gateway<T = Record<string, unknown>>(
  method: string,
  path: string,
  person: Person | null,
  body?: unknown,
): Promise<{ status: number; body: T }> {
  const response = await fetch(GATEWAY_URL + path, {
    method,
    headers: {
      Accept: 'application/json',
      ...(person ? { Authorization: `Bearer ${await token(person)}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let parsed: unknown = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }
  return { status: response.status, body: parsed as T };
}

/** Cuenta en el emulador de Firebase + registro, verificación y términos en Identidad (idempotente). */
export async function ensureUser(person: Person) {
  const project = `/projects/${FIREBASE_PROJECT}`;
  await emulator(
    `${project}/accounts`,
    {
      localId: person.uid,
      email: person.email,
      password: testPassword(),
      emailVerified: true,
    },
    true,
  );
  await emulator(
    `${project}/accounts:update`,
    { localId: person.uid, emailVerified: true },
    true,
  );
  const signup = await gateway('POST', '/estudiantes', person, {
    correo_institucional: person.email,
    nombre: person.name,
    campus: 'Monterrico',
    carrera: 'Ingeniería de Software',
    ciclo: 6,
    telefono: person.phone,
  });
  if (![201, 409].includes(signup.status))
    throw new Error(
      `Identidad no registró a ${person.uid}: HTTP ${signup.status} ${JSON.stringify(signup.body)}`,
    );
  const docs = await gateway<{
    version_terminos: string;
    version_descargo: string;
  }>('GET', '/documentos/terminos', null);
  const accepted = await gateway(
    'POST',
    '/estudiantes/me/aceptacion-terminos',
    person,
    {
      version_terminos_aceptada: docs.body.version_terminos,
      version_descargo_aceptada: docs.body.version_descargo,
    },
  );
  if (accepted.status !== 200)
    throw new Error(
      `Identidad no aceptó los términos: HTTP ${accepted.status}`,
    );
  const me = await gateway<{ usuario: { id: string } }>(
    'GET',
    '/estudiantes/me',
    person,
  );
  return me.body.usuario.id;
}

/** Publica un objeto con disponibilidad amplia, como lo hace lendup-e2e (función `publicar`). */
export async function publish(owner: Person, title: string) {
  const created = await gateway('POST', '/catalogo/publicaciones', owner, {
    detalles: {
      categoriaId: 'c0000000-0000-4000-8000-000000000002',
      titulo: title,
      descripcion: 'Calculadora científica para pruebas E2E',
      condicionObjeto: 'GOOD',
      universidad: 'UPC',
      campus: 'Monterrico',
      ubicacion: 'Pabellón A',
    },
    condiciones: {
      tarifaDiaria: 20,
      garantiaMonetaria: 50,
      moneda: 'PEN',
      lugarIntercambio: 'Campus Monterrico',
      condicionesUso: 'Uso académico',
      condicionesEntrega: 'Entrega personal',
      condicionesDevolucion: 'Mismo estado',
      condicionesCancelacion: 'Antes de la entrega',
    },
  });
  if (created.status !== 201)
    throw new Error(
      `Catálogo no publicó: HTTP ${created.status} ${JSON.stringify(created.body)}`,
    );
  const id = (created.body as { id: string }).id;
  const slot = await gateway(
    'POST',
    `/catalogo/publicaciones/${id}/disponibilidades`,
    owner,
    {
      desde: lima(Date.now() - 30 * 24 * HOUR),
      hasta: lima(Date.now() + 120 * 24 * HOUR),
    },
  );
  if (slot.status !== 201)
    throw new Error(
      `Catálogo no guardó la disponibilidad: HTTP ${slot.status} ${JSON.stringify(slot.body)}`,
    );
  return id;
}

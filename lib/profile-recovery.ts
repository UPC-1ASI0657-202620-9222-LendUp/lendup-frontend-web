export function isMissingProfile(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as { status?: number; message?: string };
  return (
    value.status === 403 && value.message === 'Registra tu perfil en LendUp'
  );
}

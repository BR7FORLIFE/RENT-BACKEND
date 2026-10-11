// Roles globales (claim `rols` del JWT emitido por rent-auth) que pueden administrar el
// catalogo y modificar ofertas ajenas. Se comparan en mayusculas y con/sin prefijo ROLE_.
const SERVICE_ADMIN_ROLES = ['ADMIN', 'ADMINISTRADOR'];

export function isServiceAdmin(rols: string[] | undefined): boolean {
  return (rols ?? []).some((rol) =>
    SERVICE_ADMIN_ROLES.includes(rol.toUpperCase().replace(/^ROLE_/, '')),
  );
}

export interface Permission {
  key: string;
  module: string;
  description: string | null;
}

export interface RoleWithPermissions {
  id: string;
  key: string;
  name: string;
  organizationId: string | null;
  isSystem: boolean;
  permissionKeys: string[];
}

function slugifyKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function buildCustomRoleKey(name: string): string {
  return slugifyKey(name);
}

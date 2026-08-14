import { z } from "zod";

export const InviteMemberSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  roleId: z.string().uuid("Selecione um papel"),
  clientAccessMode: z.enum(["all", "restricted"]),
  clientIds: z.array(z.string().uuid()).default([]),
});

export const UpdateMemberRoleSchema = z.object({
  membershipId: z.string().uuid(),
  roleId: z.string().uuid(),
});

export const UpdateMemberClientAccessSchema = z.object({
  membershipId: z.string().uuid(),
  clientAccessMode: z.enum(["all", "restricted"]),
  clientIds: z.array(z.string().uuid()).default([]),
});

export const ChangeMemberStatusSchema = z.object({
  membershipId: z.string().uuid(),
  status: z.enum(["active", "suspended", "removed"]),
});

export const CreateRoleSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(60),
  description: z.string().trim().optional(),
  permissionKeys: z.array(z.string()).default([]),
});

export const UpdateRolePermissionsSchema = z.object({
  roleId: z.string().uuid(),
  permissionKeys: z.array(z.string()).default([]),
});

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;
export type UpdateMemberClientAccessInput = z.infer<typeof UpdateMemberClientAccessSchema>;
export type ChangeMemberStatusInput = z.infer<typeof ChangeMemberStatusSchema>;
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRolePermissionsInput = z.infer<typeof UpdateRolePermissionsSchema>;

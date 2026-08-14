"use server";

import { revalidatePath } from "next/cache";
import {
  inviteMember,
  updateMemberRole,
  updateMemberClientAccess,
  changeMemberStatus,
  createRole,
  updateRolePermissions,
  IdentityAppError,
  type InviteMemberInput,
  type UpdateMemberRoleInput,
  type UpdateMemberClientAccessInput,
  type ChangeMemberStatusInput,
  type CreateRoleInput,
  type UpdateRolePermissionsInput,
} from "@/modules/identity";

type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

function toUserMessage(error: unknown): string {
  if (error instanceof IdentityAppError) return error.message;
  return "Não foi possível concluir a ação. Tente novamente em instantes.";
}

function revalidateAcessos() {
  revalidatePath("/flow/acessos");
}

export async function inviteMemberAction(
  input: InviteMemberInput
): Promise<ActionResult<{ emailSent: boolean; emailError: string | null }>> {
  try {
    const result = await inviteMember(input);
    revalidateAcessos();
    return { ok: true, data: { emailSent: result.emailSent, emailError: result.emailError } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateMemberRoleAction(input: UpdateMemberRoleInput): Promise<ActionResult<null>> {
  try {
    await updateMemberRole(input);
    revalidateAcessos();
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateMemberClientAccessAction(
  input: UpdateMemberClientAccessInput
): Promise<ActionResult<null>> {
  try {
    await updateMemberClientAccess(input);
    revalidateAcessos();
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function changeMemberStatusAction(input: ChangeMemberStatusInput): Promise<ActionResult<null>> {
  try {
    await changeMemberStatus(input);
    revalidateAcessos();
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function createRoleAction(input: CreateRoleInput): Promise<ActionResult<{ id: string }>> {
  try {
    const role = await createRole(input);
    revalidateAcessos();
    return { ok: true, data: { id: role.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateRolePermissionsAction(
  input: UpdateRolePermissionsInput
): Promise<ActionResult<null>> {
  try {
    await updateRolePermissions(input);
    revalidateAcessos();
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

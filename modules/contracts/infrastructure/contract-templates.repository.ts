import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContractTemplate } from "../domain/types";

interface TemplateRow {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  service_id: string | null;
  content: string;
  active: boolean;
}

function toTemplate(row: TemplateRow): ContractTemplate {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    slug: row.slug,
    serviceId: row.service_id,
    content: row.content,
    active: row.active,
  };
}

export async function listTemplates(
  supabase: SupabaseClient,
  organizationId: string
): Promise<ContractTemplate[]> {
  const { data, error } = await supabase
    .from("contract_templates")
    .select("id, organization_id, name, slug, service_id, content, active")
    .eq("organization_id", organizationId)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return ((data as TemplateRow[]) ?? []).map(toTemplate);
}

export async function getTemplateById(
  supabase: SupabaseClient,
  id: string
): Promise<ContractTemplate | null> {
  const { data, error } = await supabase
    .from("contract_templates")
    .select("id, organization_id, name, slug, service_id, content, active")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? toTemplate(data as TemplateRow) : null;
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createTemplate(
  supabase: SupabaseClient,
  organizationId: string,
  createdBy: string,
  input: { name: string; serviceId: string | null; content: string }
): Promise<ContractTemplate> {
  const { data, error } = await supabase
    .from("contract_templates")
    .insert({
      organization_id: organizationId,
      created_by: createdBy,
      name: input.name,
      slug: slugify(input.name),
      service_id: input.serviceId,
      content: input.content,
    })
    .select("id, organization_id, name, slug, service_id, content, active")
    .single();

  if (error) throw error;
  return toTemplate(data as TemplateRow);
}

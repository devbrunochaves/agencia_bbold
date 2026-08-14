import type { SupabaseClient } from "@supabase/supabase-js";
import type { Service } from "../domain/types";

interface ServiceRow {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
}

function toService(row: ServiceRow): Service {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    active: row.active,
  };
}

export async function listServices(
  supabase: SupabaseClient,
  organizationId: string
): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id, organization_id, name, slug, description, active")
    .eq("organization_id", organizationId)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as ServiceRow[]).map(toService);
}

export async function getServiceById(supabase: SupabaseClient, id: string): Promise<Service | null> {
  const { data, error } = await supabase
    .from("services")
    .select("id, organization_id, name, slug, description, active")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? toService(data as ServiceRow) : null;
}

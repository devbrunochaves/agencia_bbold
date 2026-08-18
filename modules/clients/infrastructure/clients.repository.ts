import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Client, ClientStatus } from "../domain/types";
import type { ClientFormInput } from "../domain/schemas";

interface ClientRow {
  id: string;
  organization_id: string;
  name: string;
  legal_name: string | null;
  document_type: Client["documentType"];
  document_number: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: ClientStatus;
  client_type: Client["clientType"];
  start_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip_code: string | null;
  representative_name: string | null;
  representative_document: string | null;
  client_services: {
    service_id: string;
    status: Client["services"][number]["status"];
    service: { name: string } | null;
  }[];
}

const CLIENT_SELECT = `
  id, organization_id, name, legal_name, document_type, document_number,
  email, phone, website, status, client_type, start_date, notes,
  created_by, created_at, updated_at,
  address_street, address_number, address_complement, address_neighborhood,
  address_city, address_state, address_zip_code,
  representative_name, representative_document,
  client_services ( service_id, status, service:services ( name ) )
`;

function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    legalName: row.legal_name,
    documentType: row.document_type,
    documentNumber: row.document_number,
    email: row.email,
    phone: row.phone,
    website: row.website,
    status: row.status,
    clientType: row.client_type,
    startDate: row.start_date,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    addressStreet: row.address_street,
    addressNumber: row.address_number,
    addressComplement: row.address_complement,
    addressNeighborhood: row.address_neighborhood,
    addressCity: row.address_city,
    addressState: row.address_state,
    addressZipCode: row.address_zip_code,
    representativeName: row.representative_name,
    representativeDocument: row.representative_document,
    services: (row.client_services ?? [])
      .filter((cs) => cs.status !== "ended")
      .map((cs) => ({
        serviceId: cs.service_id,
        serviceName: cs.service?.name ?? "",
        status: cs.status,
      })),
  };
}

export interface ListClientsFilters {
  status?: ClientStatus;
  search?: string;
  serviceId?: string;
  limit?: number;
  offset?: number;
}

export async function listClients(
  supabase: SupabaseClient,
  organizationId: string,
  filters: ListClientsFilters = {}
): Promise<Client[]> {
  let query = supabase
    .from("clients")
    .select(CLIENT_SELECT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.search) {
    const term = filters.search.replace(/[%_]/g, "");
    query = query.or(
      `name.ilike.%${term}%,legal_name.ilike.%${term}%,document_number.ilike.%${term}%`
    );
  }

  if (filters.limit) {
    const from = filters.offset ?? 0;
    query = query.range(from, from + filters.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;

  let rows = (data as unknown as ClientRow[]) ?? [];

  // service_id filter applied in-memory: filtering through the embedded
  // client_services relation in the query builder would require an inner
  // join that changes the shape of the response; simplest to keep the
  // select stable and filter the small resulting set here.
  if (filters.serviceId) {
    rows = rows.filter((row) =>
      row.client_services.some((cs) => cs.service_id === filters.serviceId && cs.status !== "ended")
    );
  }

  return rows.map(toClient);
}

export async function getClientById(supabase: SupabaseClient, id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from("clients")
    .select(CLIENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? toClient(data as unknown as ClientRow) : null;
}

function toClientRowInput(input: ClientFormInput) {
  return {
    name: input.name,
    legal_name: input.legalName ?? null,
    document_type: input.documentType ?? null,
    document_number: input.documentNumber ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    website: input.website ?? null,
    status: input.status,
    client_type: input.clientType,
    start_date: input.startDate ?? null,
    notes: input.notes ?? null,
  };
}

export async function createClient(
  supabase: SupabaseClient,
  organizationId: string,
  createdBy: string,
  input: ClientFormInput
): Promise<Client> {
  // No .select() chained onto this insert: INSERT ... RETURNING evaluates
  // the SELECT policy (can_view_client, which self-joins clients) against
  // the just-inserted row using the command's own snapshot, and that row
  // isn't visible to a self-referencing query within the same statement —
  // Postgres raises "new row violates row-level security policy" even
  // though the row is fully visible right after, in a separate statement.
  // Generating the id here and reading it back with a plain follow-up
  // SELECT (getClientById) avoids RETURNING entirely.
  const id = randomUUID();

  const { error } = await supabase.from("clients").insert({
    id,
    organization_id: organizationId,
    created_by: createdBy,
    ...toClientRowInput(input),
  });

  if (error) throw error;

  await syncClientServices(supabase, organizationId, id, input.serviceIds);

  const client = await getClientById(supabase, id);
  if (!client) throw new Error("Cliente criado, mas não foi possível recarregá-lo.");
  return client;
}

export async function updateClient(
  supabase: SupabaseClient,
  organizationId: string,
  id: string,
  input: ClientFormInput
): Promise<Client> {
  const { error } = await supabase.from("clients").update(toClientRowInput(input)).eq("id", id);
  if (error) throw error;

  await syncClientServices(supabase, organizationId, id, input.serviceIds);

  const client = await getClientById(supabase, id);
  if (!client) throw new Error("Cliente atualizado, mas não foi possível recarregá-lo.");
  return client;
}

export async function changeClientStatus(
  supabase: SupabaseClient,
  id: string,
  status: ClientStatus
): Promise<Client> {
  const { error } = await supabase.from("clients").update({ status }).eq("id", id);
  if (error) throw error;

  const client = await getClientById(supabase, id);
  if (!client) throw new Error("Cliente atualizado, mas não foi possível recarregá-lo.");
  return client;
}

/**
 * Reconciles client_services with the selected service ids. Called only
 * from within this repository (create/update), never directly from the UI
 * or from application code — client_services is owned by the Client
 * aggregate.
 */
async function syncClientServices(
  supabase: SupabaseClient,
  organizationId: string,
  clientId: string,
  serviceIds: string[]
): Promise<void> {
  const { data: existing, error: existingError } = await supabase
    .from("client_services")
    .select("service_id")
    .eq("client_id", clientId);

  if (existingError) throw existingError;

  const existingIds = new Set((existing ?? []).map((row) => row.service_id as string));
  const nextIds = new Set(serviceIds);

  const toRemove = [...existingIds].filter((id) => !nextIds.has(id));
  const toAdd = [...nextIds].filter((id) => !existingIds.has(id));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("client_services")
      .delete()
      .eq("client_id", clientId)
      .in("service_id", toRemove);
    if (error) throw error;
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from("client_services").insert(
      toAdd.map((serviceId) => ({
        organization_id: organizationId,
        client_id: clientId,
        service_id: serviceId,
        status: "active",
        started_at: new Date().toISOString().slice(0, 10),
      }))
    );
    if (error) throw error;
  }
}

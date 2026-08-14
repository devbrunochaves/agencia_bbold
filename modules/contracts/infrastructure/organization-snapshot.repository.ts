import type { SupabaseClient } from "@supabase/supabase-js";
import type { PartySnapshot } from "../domain/types";

interface OrganizationRow {
  name: string;
  legal_name: string | null;
  document_number: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip_code: string | null;
  representative_name: string | null;
  representative_document: string | null;
}

/** BBOLD's own legal data (the "contratada"), used to build every contract's contractor_snapshot. */
export async function getOrganizationContractorSnapshot(
  supabase: SupabaseClient,
  organizationId: string
): Promise<PartySnapshot> {
  const { data, error } = await supabase
    .from("organizations")
    .select(
      "name, legal_name, document_number, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip_code, representative_name, representative_document"
    )
    .eq("id", organizationId)
    .single();

  if (error) throw error;
  const row = data as OrganizationRow;

  return {
    name: row.name,
    legalName: row.legal_name,
    documentType: null,
    documentNumber: row.document_number,
    email: null,
    phone: null,
    addressStreet: row.address_street,
    addressNumber: row.address_number,
    addressComplement: row.address_complement,
    addressNeighborhood: row.address_neighborhood,
    addressCity: row.address_city,
    addressState: row.address_state,
    addressZipCode: row.address_zip_code,
    representativeName: row.representative_name,
    representativeDocument: row.representative_document,
  };
}

import type { Client } from "@/modules/clients/domain/types";
import type { PartySnapshot } from "@/modules/contracts/domain/types";

/** Prefill from the client's current record — user can still review/edit before saving (§33). */
export function clientToSnapshot(client: Client): PartySnapshot {
  return {
    name: client.name,
    legalName: client.legalName,
    documentType: client.documentType,
    documentNumber: client.documentNumber,
    email: client.email,
    phone: client.phone,
    addressStreet: client.addressStreet,
    addressNumber: client.addressNumber,
    addressComplement: client.addressComplement,
    addressNeighborhood: client.addressNeighborhood,
    addressCity: client.addressCity,
    addressState: client.addressState,
    addressZipCode: client.addressZipCode,
    representativeName: client.representativeName,
    representativeDocument: client.representativeDocument,
  };
}

export function emptySnapshot(): PartySnapshot {
  return {
    name: "",
    legalName: null,
    documentType: null,
    documentNumber: null,
    email: null,
    phone: null,
    addressStreet: null,
    addressNumber: null,
    addressComplement: null,
    addressNeighborhood: null,
    addressCity: null,
    addressState: null,
    addressZipCode: null,
    representativeName: null,
    representativeDocument: null,
  };
}

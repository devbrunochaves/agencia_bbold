export type ClientStatus = "prospect" | "active" | "paused" | "closed";
export type ClientType = "recurring" | "project" | "internal";
export type DocumentType = "cpf" | "cnpj" | "other";
export type ClientServiceStatus = "active" | "paused" | "ended";

export interface ClientServiceLink {
  serviceId: string;
  serviceName: string;
  status: ClientServiceStatus;
}

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  legalName: string | null;
  documentType: DocumentType | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: ClientStatus;
  clientType: ClientType;
  startDate: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  services: ClientServiceLink[];
}

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  prospect: "Prospect",
  active: "Ativo",
  paused: "Pausado",
  closed: "Encerrado",
};

export const CLIENT_TYPE_LABEL: Record<ClientType, string> = {
  recurring: "Recorrente",
  project: "Projeto",
  internal: "Interno",
};

/** Status transitions allowed from the row actions menu. */
export const CLIENT_STATUS_ACTIONS: Record<ClientStatus, ClientStatus[]> = {
  prospect: ["active", "closed"],
  active: ["paused", "closed"],
  paused: ["active", "closed"],
  closed: [],
};

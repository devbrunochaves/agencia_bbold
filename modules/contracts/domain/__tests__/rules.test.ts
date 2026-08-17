import { describe, expect, it } from "vitest";
import type { Contract, PartySnapshot } from "../types";
import {
  canTransition,
  getMissingContractorFields,
  installmentsMatchTotal,
  splitAmountIntoInstallments,
  sumSignedValueForMonth,
} from "../rules";

function makeSnapshot(overrides: Partial<PartySnapshot> = {}): PartySnapshot {
  return {
    name: "BBOLD",
    legalName: "BBOLD Serviços Digitais LTDA",
    documentType: "cnpj",
    documentNumber: "12345678000199",
    email: null,
    phone: null,
    addressStreet: "Rua Exemplo",
    addressNumber: "100",
    addressComplement: null,
    addressNeighborhood: "Centro",
    addressCity: "São Paulo",
    addressState: "SP",
    addressZipCode: "00000-000",
    representativeName: "Bruno Chaves",
    representativeDocument: "12345678900",
    ...overrides,
  };
}

function makeContract(overrides: Partial<Contract> & { id: string }): Contract {
  return {
    organizationId: "org-1",
    clientId: "client-1",
    clientName: "Cliente",
    serviceId: null,
    serviceName: null,
    templateId: null,
    title: "Contrato de teste",
    status: "signed",
    contractNumber: null,
    startDate: "2026-08-01",
    endDate: null,
    billingType: "one_time",
    totalAmountCents: 500_000,
    recurringAmountCents: null,
    billingDay: null,
    paymentMethod: "pix",
    installmentsCount: null,
    city: "São Paulo",
    signatureDate: null,
    clientSnapshot: makeSnapshot({ name: "Cliente" }),
    contractorSnapshot: makeSnapshot(),
    contentSnapshot: "...",
    sentAt: null,
    signedAt: null,
    cancelledAt: null,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
    installments: [],
    ...overrides,
  };
}

describe("canTransition (§34 status transitions)", () => {
  it("allows draft -> sent -> signed, in order", () => {
    expect(canTransition("draft", "sent")).toBe(true);
    expect(canTransition("sent", "signed")).toBe(true);
  });

  it("rejects skipping sent (draft -> signed directly)", () => {
    expect(canTransition("draft", "signed")).toBe(false);
  });

  it("rejects any transition out of a terminal state", () => {
    expect(canTransition("signed", "draft")).toBe(false);
    expect(canTransition("cancelled", "draft")).toBe(false);
  });
});

describe("installmentsMatchTotal / splitAmountIntoInstallments (§34 contract billing)", () => {
  it("splits an amount that divides evenly", () => {
    expect(splitAmountIntoInstallments(300_000, 3)).toEqual([100_000, 100_000, 100_000]);
  });

  it("puts the rounding remainder on the last installment, never losing/gaining a cent", () => {
    const installments = splitAmountIntoInstallments(100_000, 3); // 33333.33... per installment
    expect(installments).toEqual([33_333, 33_333, 33_334]);
    expect(installmentsMatchTotal(installments, 100_000)).toBe(true);
  });

  it("returns an empty split for a non-positive count", () => {
    expect(splitAmountIntoInstallments(100_000, 0)).toEqual([]);
  });
});

describe("getMissingContractorFields (§76 legal data gate)", () => {
  it("returns no missing fields when the contractor snapshot is complete", () => {
    expect(getMissingContractorFields(makeSnapshot())).toEqual([]);
  });

  it("lists every required field that is null, never a partial/silent pass", () => {
    const incomplete = makeSnapshot({ legalName: null, documentNumber: null, representativeDocument: null });
    expect(getMissingContractorFields(incomplete)).toEqual(["Razão social", "CNPJ", "Documento do representante"]);
  });
});

describe("sumSignedValueForMonth (§29 operational timezone)", () => {
  it("attributes a contract signed late at night in Brazil to the correct (local) month, not UTC", () => {
    // 2026-01-31 23:00 in America/Sao_Paulo (UTC-3) = 2026-02-01 02:00 UTC.
    // A naive getUTCMonth() read would misattribute this to February.
    const contract = makeContract({ id: "c1", signedAt: "2026-02-01T02:00:00Z", totalAmountCents: 500_000 });
    expect(sumSignedValueForMonth([contract], "2026-01")).toBe(500_000);
    expect(sumSignedValueForMonth([contract], "2026-02")).toBe(0);
  });

  it("only sums signed contracts, using recurringAmountCents for recurring billing", () => {
    const signed = makeContract({ id: "c1", signedAt: "2026-08-10T12:00:00Z", totalAmountCents: 500_000 });
    const recurring = makeContract({
      id: "c2",
      signedAt: "2026-08-15T12:00:00Z",
      billingType: "recurring",
      recurringAmountCents: 90_000,
      totalAmountCents: null,
    });
    const draft = makeContract({ id: "c3", status: "draft", signedAt: null, totalAmountCents: 999_999 });

    expect(sumSignedValueForMonth([signed, recurring, draft], "2026-08")).toBe(590_000);
  });
});

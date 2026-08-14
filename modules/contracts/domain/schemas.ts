import { z } from "zod";

const optionalUuid = z
  .string()
  .uuid()
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");
const isoDateOrNull = isoDate
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));

export const PartySnapshotSchema = z.object({
  name: z.string().trim().min(1),
  legalName: z.string().trim().nullable(),
  documentType: z.string().trim().nullable(),
  documentNumber: z.string().trim().nullable(),
  email: z.string().trim().nullable(),
  phone: z.string().trim().nullable(),
  addressStreet: z.string().trim().nullable(),
  addressNumber: z.string().trim().nullable(),
  addressComplement: z.string().trim().nullable(),
  addressNeighborhood: z.string().trim().nullable(),
  addressCity: z.string().trim().nullable(),
  addressState: z.string().trim().nullable(),
  addressZipCode: z.string().trim().nullable(),
  representativeName: z.string().trim().nullable(),
  representativeDocument: z.string().trim().nullable(),
});

const BillingFieldsSchema = z
  .object({
    billingType: z.enum(["one_time", "installment", "recurring"]),
    totalAmountCents: z.number().int().nullable().optional(),
    recurringAmountCents: z.number().int().nullable().optional(),
    billingDay: z.number().int().min(1).max(28).nullable().optional(),
    installmentsCount: z.number().int().min(1).max(60).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.billingType === "recurring") {
      if (!data.recurringAmountCents || data.recurringAmountCents <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["recurringAmountCents"], message: "Informe o valor da mensalidade" });
      }
      if (!data.billingDay) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["billingDay"], message: "Informe o dia de cobrança" });
      }
    } else {
      if (!data.totalAmountCents || data.totalAmountCents <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["totalAmountCents"], message: "Informe o valor total" });
      }
      if (data.billingType === "installment" && (!data.installmentsCount || data.installmentsCount < 1)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["installmentsCount"], message: "Informe a quantidade de parcelas" });
      }
    }
  });

export const ContractFormSchema = z
  .object({
    templateId: optionalUuid,
    clientId: z.string().uuid("Selecione um cliente"),
    serviceId: optionalUuid,
    title: z.string().trim().min(1, "Título é obrigatório").max(200),
    description: z.string().trim().default(""),
    startDate: isoDate,
    endDate: isoDateOrNull,
    paymentMethod: z.enum(["pix", "bank_transfer", "credit_card", "cash", "other"]),
    city: z.string().trim().min(1, "Cidade é obrigatória"),
    signatureDate: isoDateOrNull,
    clientSnapshot: PartySnapshotSchema,
    installmentDueDates: z.array(isoDate).optional(),
  })
  .and(BillingFieldsSchema);

export type ContractFormInput = z.infer<typeof ContractFormSchema>;

export const ChangeContractStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "sent", "signed", "cancelled"]),
});

export const CreateFinanceFromContractSchema = z.object({
  contractId: z.string().uuid(),
});

export const CreateContractTemplateSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  serviceId: optionalUuid,
  content: z.string().trim().min(1, "Conteúdo é obrigatório"),
});

export type ChangeContractStatusInput = z.infer<typeof ChangeContractStatusSchema>;
export type CreateFinanceFromContractInput = z.infer<typeof CreateFinanceFromContractSchema>;
export type CreateContractTemplateInput = z.infer<typeof CreateContractTemplateSchema>;

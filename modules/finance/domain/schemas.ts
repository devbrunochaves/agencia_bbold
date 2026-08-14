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

export const FinancialEntryFormSchema = z.object({
  type: z.enum(["income", "expense"]),
  description: z.string().trim().min(1, "Descrição é obrigatória").max(200),
  clientId: optionalUuid,
  categoryId: z.string().uuid("Selecione uma categoria"),
  amountCents: z.number().int().positive("Valor deve ser maior que zero"),
  competenceMonth: isoDate,
  dueDate: isoDateOrNull,
  paidAt: isoDateOrNull,
  requiresInvoice: z.boolean().default(false),
  notes: z
    .string()
    .trim()
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .optional(),
});

export const CreateFinancialEntrySchema = FinancialEntryFormSchema;
export const UpdateFinancialEntrySchema = FinancialEntryFormSchema.extend({
  id: z.string().uuid(),
});

export const FinancialEntryFilterSchema = z.object({
  competenceMonth: isoDate.optional(),
  type: z.enum(["income", "expense"]).optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(["planned", "pending", "paid", "cancelled"]).optional(),
  clientId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const CreateFinancialCategorySchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100),
  type: z.enum(["income", "expense"]),
});

export const UpdateFinancialCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Nome é obrigatório").max(100).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const CreateFinancialRecurrenceSchema = z.object({
  type: z.enum(["income", "expense"]),
  clientId: optionalUuid,
  categoryId: z.string().uuid("Selecione uma categoria"),
  description: z.string().trim().min(1, "Descrição é obrigatória").max(200),
  amountCents: z.number().int().positive("Valor deve ser maior que zero"),
  frequency: z.enum(["monthly", "one_time", "installment"]).default("monthly"),
  startDate: isoDate,
  endDate: isoDateOrNull,
  dayOfMonth: z.number().int().min(1).max(28).nullable().optional(),
});

export const UpdateFinancialSettingsSchema = z.object({
  monthlyRevenueGoalCents: z.number().int().min(0),
  openingBalanceCents: z.number().int(),
  openingBalanceDate: isoDate,
});

export type FinancialEntryFormInput = z.infer<typeof FinancialEntryFormSchema>;
export type CreateFinancialEntryInput = z.infer<typeof CreateFinancialEntrySchema>;
export type UpdateFinancialEntryInput = z.infer<typeof UpdateFinancialEntrySchema>;
export type FinancialEntryFilterInput = z.infer<typeof FinancialEntryFilterSchema>;
export type CreateFinancialCategoryInput = z.infer<typeof CreateFinancialCategorySchema>;
export type UpdateFinancialCategoryInput = z.infer<typeof UpdateFinancialCategorySchema>;
export type CreateFinancialRecurrenceInput = z.infer<typeof CreateFinancialRecurrenceSchema>;
export type UpdateFinancialSettingsInput = z.infer<typeof UpdateFinancialSettingsSchema>;

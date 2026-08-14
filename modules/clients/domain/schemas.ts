import { z } from "zod";

const optionalTrimmed = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

const documentNumberSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 0 || v.length === 11 || v.length === 14, {
    message: "Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)",
  })
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

export const ClientFormSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(200),
  legalName: optionalTrimmed,
  documentType: z.enum(["cpf", "cnpj", "other"]).nullable().optional(),
  documentNumber: documentNumberSchema,
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  phone: optionalTrimmed,
  website: z
    .string()
    .trim()
    .url("Website inválido")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  status: z.enum(["prospect", "active", "paused", "closed"]),
  clientType: z.enum(["recurring", "project", "internal"]),
  startDate: optionalTrimmed,
  notes: optionalTrimmed,
  serviceIds: z.array(z.string().uuid()).default([]),
});

export const CreateClientSchema = ClientFormSchema;
export const UpdateClientSchema = ClientFormSchema.extend({
  id: z.string().uuid(),
});

export const ChangeClientStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["prospect", "active", "paused", "closed"]),
});

export type ClientFormInput = z.infer<typeof ClientFormSchema>;
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type ChangeClientStatusInput = z.infer<typeof ChangeClientStatusSchema>;

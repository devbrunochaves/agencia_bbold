import { z } from "zod";

const optionalTrimmed = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

const optionalUuid = z
  .string()
  .uuid()
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));

export const TaskFormSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(200),
  description: optionalTrimmed,
  clientId: z.string().uuid("Selecione um cliente"),
  serviceId: optionalUuid,
  assigneeId: optionalUuid,
  status: z.enum([
    "backlog",
    "todo",
    "in_progress",
    "internal_review",
    "waiting_client",
    "changes_requested",
    "approved",
    "completed",
    "cancelled",
  ]),
  priority: z.enum(["none", "normal", "high", "urgent"]),
  dueDate: optionalTrimmed,
});

export const CreateTaskSchema = TaskFormSchema;
export const UpdateTaskSchema = TaskFormSchema.extend({
  id: z.string().uuid(),
});

export const ChangeTaskStatusSchema = z.object({
  id: z.string().uuid(),
  status: TaskFormSchema.shape.status,
});

export const AssignTaskSchema = z.object({
  id: z.string().uuid(),
  assigneeId: optionalUuid,
});

export const TaskFilterSchema = z.object({
  clientId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  status: TaskFormSchema.shape.status.optional(),
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
  overdue: z.boolean().optional(),
  includeCompleted: z.boolean().optional(),
  search: z.string().optional(),
});

export type TaskFormInput = z.infer<typeof TaskFormSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type ChangeTaskStatusInput = z.infer<typeof ChangeTaskStatusSchema>;
export type AssignTaskInput = z.infer<typeof AssignTaskSchema>;
export type TaskFilterInput = z.infer<typeof TaskFilterSchema>;

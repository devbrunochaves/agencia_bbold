export class TasksAppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TasksAppError";
  }
}

export class UnauthorizedError extends TasksAppError {
  constructor() {
    super("Você não tem permissão para realizar esta ação.");
  }
}

export class ValidationError extends TasksAppError {
  constructor(message = "Dados inválidos.") {
    super(message);
  }
}

export class ContractsAppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractsAppError";
  }
}

export class UnauthorizedError extends ContractsAppError {
  constructor() {
    super("Você não tem permissão para realizar esta ação.");
  }
}

export class ValidationError extends ContractsAppError {
  constructor(message = "Dados inválidos.") {
    super(message);
  }
}

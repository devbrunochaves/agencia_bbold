export class FinanceAppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinanceAppError";
  }
}

export class UnauthorizedError extends FinanceAppError {
  constructor() {
    super("Você não tem permissão para realizar esta ação.");
  }
}

export class ValidationError extends FinanceAppError {
  constructor(message = "Dados inválidos.") {
    super(message);
  }
}

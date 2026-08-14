export class IdentityAppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdentityAppError";
  }
}

export class UnauthorizedError extends IdentityAppError {
  constructor() {
    super("Você não tem permissão para realizar esta ação.");
  }
}

export class ValidationError extends IdentityAppError {
  constructor(message = "Dados inválidos.") {
    super(message);
  }
}

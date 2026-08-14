export class ClientsAppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientsAppError";
  }
}

export class UnauthorizedError extends ClientsAppError {
  constructor() {
    super("Você não tem permissão para realizar esta ação.");
  }
}

export class ValidationError extends ClientsAppError {
  constructor(message = "Dados inválidos.") {
    super(message);
  }
}

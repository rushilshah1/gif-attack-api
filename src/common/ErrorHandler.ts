import { ABError } from "./ABError";

export class ErrorHandler {
  constructor() {}
  handleError(err: any, message?: string, status?: number): ABError {
    status = !status && err.statusCode ? err.statusCode : status;
    status =
      !status && err.error && err.error.statusCode ? err.statusCode : status;
    message = !message && err.message ? err.message : message;
    return new ABError({
      message: message,
      status: status,
      error: err,
    });
  }
}
export default new ErrorHandler();

// An error that carries an HTTP status code, so services can say *why* a request failed
// and the error handler can turn it into the right response.
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

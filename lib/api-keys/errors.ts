/**
 * Typed error for the public API. Carries an HTTP status + stable machine code
 * so `withApiKey` can render a uniform `{ error: { code, message } }` body.
 */
export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

export const ApiErrors = {
  unauthorized: (message = "Invalid or missing API key") => new ApiError(401, "unauthorized", message),
  forbidden: (message = "You do not have access to this resource") => new ApiError(403, "forbidden", message),
  notFound: (message = "Resource not found") => new ApiError(404, "not_found", message),
  badRequest: (message = "Invalid request") => new ApiError(400, "bad_request", message),
  rateLimited: (message = "Rate limit exceeded") => new ApiError(429, "rate_limited", message),
  internal: (message = "Internal server error") => new ApiError(500, "internal_error", message),
}

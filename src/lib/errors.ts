export class AppError extends Error {
  public readonly cause?: unknown

  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    options?: { cause?: unknown }
  ) {
    super(message)
    this.name = 'AppError'
    this.cause = options?.cause
  }
}

export const ErrorCodes = {
  CONFIG: {
    MISSING_DATABASE_URL: 'E_CONFIG_001',
  },
  DB: {
    CONNECTION_ERROR: 'E_DB_001',
    SCHEMA_CONFIG_ERROR: 'E_DB_006',
    QUERY_ERROR: 'E_DB_007',
  },
  VALIDATION: {
    INVALID_INPUT: 'E_VALIDATION_001',
    INVALID_RATIO: 'E_VALIDATION_002',
  },
  AUTH: {
    UNAUTHORIZED: 'E_AUTH_001',
    FORBIDDEN: 'E_AUTH_002',
  },
  NOT_FOUND: {
    USER_NOT_FOUND: 'E_NOT_FOUND_001',
    GROUP_NOT_FOUND: 'E_NOT_FOUND_002',
  },
  INTERNAL: {
    DATABASE_ERROR: 'E_INTERNAL_001',
  },
} as const

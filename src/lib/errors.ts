export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const ErrorCodes = {
  CONFIG: {
    MISSING_DATABASE_URL: 'E_CONFIG_001',
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

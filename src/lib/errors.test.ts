import { describe, it, expect } from 'vitest'
import { AppError, ErrorCodes } from './errors'

describe('L-OC-003: AppError class', () => {
  it('creates error with code, message, and status code', () => {
    const error = new AppError('E_TEST_001', 'Test error message', 400)

    expect(error.code).toBe('E_TEST_001')
    expect(error.message).toBe('Test error message')
    expect(error.statusCode).toBe(400)
    expect(error.name).toBe('AppError')
  })

  it('defaults to status code 500 when not provided', () => {
    const error = new AppError('E_TEST_002', 'Test error')

    expect(error.statusCode).toBe(500)
  })

  it('is an instance of Error', () => {
    const error = new AppError('E_TEST_003', 'Test error')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(AppError)
  })
})

describe('ErrorCodes constants', () => {
  it('defines CONFIG error codes', () => {
    expect(ErrorCodes.CONFIG.MISSING_DATABASE_URL).toBe('E_CONFIG_001')
  })

  it('defines VALIDATION error codes', () => {
    expect(ErrorCodes.VALIDATION.INVALID_INPUT).toBe('E_VALIDATION_001')
    expect(ErrorCodes.VALIDATION.INVALID_RATIO).toBe('E_VALIDATION_002')
  })

  it('defines AUTH error codes', () => {
    expect(ErrorCodes.AUTH.UNAUTHORIZED).toBe('E_AUTH_001')
    expect(ErrorCodes.AUTH.FORBIDDEN).toBe('E_AUTH_002')
  })

  it('defines NOT_FOUND error codes', () => {
    expect(ErrorCodes.NOT_FOUND.USER_NOT_FOUND).toBe('E_NOT_FOUND_001')
    expect(ErrorCodes.NOT_FOUND.GROUP_NOT_FOUND).toBe('E_NOT_FOUND_002')
  })

  it('defines INTERNAL error codes', () => {
    expect(ErrorCodes.INTERNAL.DATABASE_ERROR).toBe('E_INTERNAL_001')
  })
})

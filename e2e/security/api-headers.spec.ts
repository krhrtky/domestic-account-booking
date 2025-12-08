import { test, expect } from '@playwright/test'
import { verifySecurityHeaders, SECURITY_HEADERS } from './utils/headers-helpers'

test.describe('Security Headers - API Endpoints', () => {
  test('NextAuth providers endpoint should have security headers', async ({ request }) => {
    const response = await request.get('/api/auth/providers')
    
    expect(response.ok()).toBeTruthy()
    verifySecurityHeaders(response)
  })

  test('NextAuth CSRF endpoint should have security headers', async ({ request }) => {
    const response = await request.get('/api/auth/csrf')
    
    expect(response.ok()).toBeTruthy()
    verifySecurityHeaders(response)
  })

  test('NextAuth session endpoint should have security headers', async ({ request }) => {
    const response = await request.get('/api/auth/session')
    
    expect(response.ok()).toBeTruthy()
    verifySecurityHeaders(response)
  })

  test('all API endpoints have consistent headers', async ({ request }) => {
    const endpoints = [
      '/api/auth/providers',
      '/api/auth/csrf',
      '/api/auth/session',
    ]

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint)
      
      expect(response.ok(), `${endpoint} should return 200 OK`).toBeTruthy()
      
      const headers = response.headers()
      
      SECURITY_HEADERS.forEach(({ name, expectedValue }) => {
        expect(headers[name], `${endpoint}: Header ${name} should be present`).toBeDefined()
        expect(headers[name], `${endpoint}: Header ${name} should have correct value`).toBe(expectedValue)
      })
    }
  })
})

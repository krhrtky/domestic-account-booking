import { describe, it, expect } from 'vitest'
import { getClientIP } from './get-client-ip'

describe('get-client-ip', () => {
  it('extracts rightmost valid IP from x-forwarded-for header (anti-spoofing)', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.1, 198.51.100.1'
    })

    expect(getClientIP(headers)).toBe('198.51.100.1')
  })

  it('extracts single IP from x-forwarded-for', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.1'
    })

    expect(getClientIP(headers)).toBe('203.0.113.1')
  })

  it('extracts IP from x-real-ip header', () => {
    const headers = new Headers({
      'x-real-ip': '203.0.113.1'
    })

    expect(getClientIP(headers)).toBe('203.0.113.1')
  })

  it('prefers x-forwarded-for over x-real-ip', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.1',
      'x-real-ip': '198.51.100.1'
    })

    expect(getClientIP(headers)).toBe('203.0.113.1')
  })

  it('returns unknown when no IP headers present', () => {
    const headers = new Headers()

    expect(getClientIP(headers)).toBe('unknown')
  })

  it('trims whitespace from IPs', () => {
    const headers = new Headers({
      'x-forwarded-for': '  203.0.113.1  , 198.51.100.1  '
    })

    expect(getClientIP(headers)).toBe('198.51.100.1')
  })

  it('rejects invalid IPs and returns unknown', () => {
    const headers = new Headers({
      'x-forwarded-for': 'spoofed-ip, invalid'
    })

    expect(getClientIP(headers)).toBe('unknown')
  })

  it('validates IPv6 addresses', () => {
    const headers = new Headers({
      'x-forwarded-for': '2001:db8::1'
    })

    expect(getClientIP(headers)).toBe('2001:db8::1')
  })

  it('ignores spoofed and private IPs, returns unknown if no public IP', () => {
    const headers = new Headers({
      'x-forwarded-for': 'fake-ip, 10.0.0.1, 192.168.1.1'
    })

    expect(getClientIP(headers)).toBe('unknown')
  })

  it('rejects loopback addresses', () => {
    const headers = new Headers({
      'x-forwarded-for': '127.0.0.1'
    })

    expect(getClientIP(headers)).toBe('unknown')
  })

  it('rejects private Class A addresses (10.x)', () => {
    const headers = new Headers({
      'x-real-ip': '10.0.0.1'
    })

    expect(getClientIP(headers)).toBe('unknown')
  })

  it('rejects private Class B addresses (172.16-31.x)', () => {
    const headers = new Headers({
      'x-real-ip': '172.16.0.1'
    })

    expect(getClientIP(headers)).toBe('unknown')
  })

  it('rejects private Class C addresses (192.168.x)', () => {
    const headers = new Headers({
      'x-real-ip': '192.168.1.1'
    })

    expect(getClientIP(headers)).toBe('unknown')
  })

  it('accepts public IPs only', () => {
    const headers = new Headers({
      'x-forwarded-for': '192.168.1.1, 203.0.113.1'
    })

    expect(getClientIP(headers)).toBe('203.0.113.1')
  })
})

import { describe, it, expect } from 'vitest'
import { detectEncoding, convertToUTF8, EncodingType } from './encoding'

describe('encoding', () => {
  describe('detectEncoding', () => {
    describe('AC-ENC-001: UTF-8 detection', () => {
      it('detects UTF-8 without BOM', () => {
        const bytes = new TextEncoder().encode('Hello, World')
        const result = detectEncoding(bytes)
        expect(result.encoding).toBe('utf-8')
        expect(result.hasBOM).toBe(false)
      })

      it('detects UTF-8 with Japanese characters', () => {
        const bytes = new TextEncoder().encode('日付,金額,摘要')
        const result = detectEncoding(bytes)
        expect(result.encoding).toBe('utf-8')
        expect(result.hasBOM).toBe(false)
      })

      it('detects UTF-8 BOM', () => {
        const bom = new Uint8Array([0xef, 0xbb, 0xbf])
        const content = new TextEncoder().encode('Hello')
        const bytes = new Uint8Array([...bom, ...content])
        const result = detectEncoding(bytes)
        expect(result.encoding).toBe('utf-8-bom')
        expect(result.hasBOM).toBe(true)
      })
    })

    describe('AC-ENC-002: Shift-JIS detection', () => {
      it('detects Shift-JIS encoded content', () => {
        const shiftJisBytes = new Uint8Array([
          0x93, 0xfa, 0x95, 0x74, 0x2c, 0x8b, 0xe0, 0x8a, 0x7a, 0x2c, 0x93, 0xe0, 0x97, 0x65
        ])
        const result = detectEncoding(shiftJisBytes)
        expect(result.encoding).toBe('shift-jis')
        expect(result.hasBOM).toBe(false)
      })
    })
  })

  describe('convertToUTF8', () => {
    describe('AC-ENC-003: Shift-JIS to UTF-8 conversion', () => {
      it('converts Shift-JIS to UTF-8', async () => {
        const shiftJisBytes = new Uint8Array([
          0x93, 0xfa, 0x95, 0x74
        ])
        const result = await convertToUTF8(shiftJisBytes, 'shift-jis')
        expect(result).toBe('日付')
      })
    })

    it('removes BOM from UTF-8 BOM content', async () => {
      const bom = new Uint8Array([0xef, 0xbb, 0xbf])
      const content = new TextEncoder().encode('Hello')
      const bytes = new Uint8Array([...bom, ...content])
      const result = await convertToUTF8(bytes, 'utf-8-bom')
      expect(result).toBe('Hello')
    })

    it('passes through UTF-8 content unchanged', async () => {
      const bytes = new TextEncoder().encode('日付,金額,摘要')
      const result = await convertToUTF8(bytes, 'utf-8')
      expect(result).toBe('日付,金額,摘要')
    })
  })

  describe('Boundary cases', () => {
    it('handles empty content', () => {
      const bytes = new Uint8Array([])
      const result = detectEncoding(bytes)
      expect(result.encoding).toBe('utf-8')
    })

    it('handles very short content', () => {
      const bytes = new Uint8Array([0x41])
      const result = detectEncoding(bytes)
      expect(result.encoding).toBe('utf-8')
    })

    it('handles BOM-only content', () => {
      const bytes = new Uint8Array([0xef, 0xbb, 0xbf])
      const result = detectEncoding(bytes)
      expect(result.encoding).toBe('utf-8-bom')
      expect(result.hasBOM).toBe(true)
    })
  })
})

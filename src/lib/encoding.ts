export type EncodingType = 'utf-8' | 'utf-8-bom' | 'shift-jis' | 'euc-jp' | 'unknown'

export interface EncodingDetectionResult {
  encoding: EncodingType
  hasBOM: boolean
}

const UTF8_BOM = new Uint8Array([0xef, 0xbb, 0xbf])

const isUTF8BOM = (bytes: Uint8Array): boolean => {
  if (bytes.length < 3) return false
  return bytes[0] === UTF8_BOM[0] && bytes[1] === UTF8_BOM[1] && bytes[2] === UTF8_BOM[2]
}

const isValidUTF8 = (bytes: Uint8Array): boolean => {
  let i = 0
  const len = bytes.length

  while (i < len) {
    const byte = bytes[i]

    if (byte < 0x80) {
      i++
      continue
    }

    let sequenceLength: number
    if ((byte & 0xe0) === 0xc0) {
      sequenceLength = 2
    } else if ((byte & 0xf0) === 0xe0) {
      sequenceLength = 3
    } else if ((byte & 0xf8) === 0xf0) {
      sequenceLength = 4
    } else {
      return false
    }

    if (i + sequenceLength > len) return false

    for (let j = 1; j < sequenceLength; j++) {
      if ((bytes[i + j] & 0xc0) !== 0x80) return false
    }

    i += sequenceLength
  }

  return true
}

const containsShiftJISPatterns = (bytes: Uint8Array): boolean => {
  for (let i = 0; i < bytes.length - 1; i++) {
    const byte1 = bytes[i]
    const byte2 = bytes[i + 1]

    if ((byte1 >= 0x81 && byte1 <= 0x9f) || (byte1 >= 0xe0 && byte1 <= 0xfc)) {
      if ((byte2 >= 0x40 && byte2 <= 0x7e) || (byte2 >= 0x80 && byte2 <= 0xfc)) {
        return true
      }
    }
  }
  return false
}

const containsEUCJPPatterns = (bytes: Uint8Array): boolean => {
  for (let i = 0; i < bytes.length - 1; i++) {
    const byte1 = bytes[i]
    const byte2 = bytes[i + 1]

    if (byte1 >= 0xa1 && byte1 <= 0xfe) {
      if (byte2 >= 0xa1 && byte2 <= 0xfe) {
        return true
      }
    }
  }
  return false
}

export const detectEncoding = (bytes: Uint8Array): EncodingDetectionResult => {
  if (isUTF8BOM(bytes)) {
    return { encoding: 'utf-8-bom', hasBOM: true }
  }

  const startOffset = 0
  const checkBytes = bytes.slice(startOffset, Math.min(bytes.length, 8192))

  if (isValidUTF8(checkBytes)) {
    return { encoding: 'utf-8', hasBOM: false }
  }

  if (containsShiftJISPatterns(checkBytes)) {
    return { encoding: 'shift-jis', hasBOM: false }
  }

  if (containsEUCJPPatterns(checkBytes)) {
    return { encoding: 'euc-jp', hasBOM: false }
  }

  return { encoding: 'unknown', hasBOM: false }
}

export const convertToUTF8 = async (
  bytes: Uint8Array,
  sourceEncoding: EncodingType
): Promise<string> => {
  switch (sourceEncoding) {
    case 'utf-8-bom':
      return new TextDecoder('utf-8').decode(bytes.slice(3))
    case 'utf-8':
      return new TextDecoder('utf-8').decode(bytes)
    case 'shift-jis':
      return new TextDecoder('shift-jis').decode(bytes)
    case 'euc-jp':
      return new TextDecoder('euc-jp').decode(bytes)
    default:
      return new TextDecoder('utf-8').decode(bytes)
  }
}

export const readFileWithEncoding = async (file: File): Promise<{
  content: string
  encoding: EncodingType
  hasBOM: boolean
}> => {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const { encoding, hasBOM } = detectEncoding(bytes)
  const content = await convertToUTF8(bytes, encoding)

  return { content, encoding, hasBOM }
}

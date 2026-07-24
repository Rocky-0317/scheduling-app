const root = globalThis as typeof globalThis & {
  TextEncoder?: typeof TextEncoder
}

if (typeof root.TextEncoder === 'undefined') {
  class PolyfillTextEncoder {
    readonly encoding = 'utf-8'

    encode(input = '') {
      const text = String(input)
      const bytes: number[] = []

      for (let i = 0; i < text.length; i += 1) {
        const codePoint = text.codePointAt(i) ?? 0

        if (codePoint > 0xFFFF) {
          i += 1
        }

        if (codePoint <= 0x7F) {
          bytes.push(codePoint)
        } else if (codePoint <= 0x7FF) {
          bytes.push(0xC0 | (codePoint >> 6), 0x80 | (codePoint & 0x3F))
        } else if (codePoint <= 0xFFFF) {
          bytes.push(
            0xE0 | (codePoint >> 12),
            0x80 | ((codePoint >> 6) & 0x3F),
            0x80 | (codePoint & 0x3F),
          )
        } else {
          bytes.push(
            0xF0 | (codePoint >> 18),
            0x80 | ((codePoint >> 12) & 0x3F),
            0x80 | ((codePoint >> 6) & 0x3F),
            0x80 | (codePoint & 0x3F),
          )
        }
      }

      return new Uint8Array(bytes)
    }
  }

  root.TextEncoder = PolyfillTextEncoder as unknown as typeof TextEncoder
}

class Utf8TextEncoder {
  readonly encoding = 'utf-8'

  encode(input = ''): Uint8Array {
    const bytes: number[] = []
    const text = String(input)

    for (let i = 0; i < text.length; i++) {
      let codePoint = text.charCodeAt(i)

      if (codePoint >= 0xD800 && codePoint <= 0xDBFF && i + 1 < text.length) {
        const next = text.charCodeAt(i + 1)
        if (next >= 0xDC00 && next <= 0xDFFF) {
          codePoint = 0x10000 + ((codePoint - 0xD800) << 10) + (next - 0xDC00)
          i++
        }
      }

      if (codePoint <= 0x7F) {
        bytes.push(codePoint)
      } else if (codePoint <= 0x7FF) {
        bytes.push(
          0xC0 | (codePoint >> 6),
          0x80 | (codePoint & 0x3F),
        )
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

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = Utf8TextEncoder as typeof TextEncoder
}

/**
 * =============================================================
 *  Base64 Encoding / Decoding
 *
 *  Not encryption (there is no key) but an encoding that turns
 *  arbitrary bytes into printable characters:
 *      3 bytes (24 bits) → 4 groups of 6 bits → 4 characters
 *  Alphabet: A–Z a–z 0–9 + /   ('=' pads an incomplete final group)
 *
 *  Implemented by hand (not with btoa/atob) so the algorithm itself
 *  is visible. Text is first converted to UTF-8 bytes, so Turkish
 *  characters (ç, ğ, ş …) are supported.
 * =============================================================
 */
(function (C) {
  'use strict';

  const TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  /** Bytes → Base64 string. */
  function encodeBytes(bytes) {
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes[i];
      const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
      const triple = (b0 << 16) | (b1 << 8) | b2; // 24-bit number

      out += TABLE[(triple >> 18) & 63];
      out += TABLE[(triple >> 12) & 63];
      out += i + 1 < bytes.length ? TABLE[(triple >> 6) & 63] : '=';
      out += i + 2 < bytes.length ? TABLE[triple & 63] : '=';
    }
    return out;
  }

  /** Base64 string → bytes. Throws on invalid characters/length. */
  function decodeToBytes(str) {
    const clean = String(str).replace(/\s+/g, '');
    if (clean.length % 4 || /[^A-Za-z0-9+/=]/.test(clean) || /=[^=]/.test(clean)) throw C.cipherError('base64Invalid');

    const bytes = [];
    for (let i = 0; i < clean.length; i += 4) {
      const chunk = clean.slice(i, i + 4);
      const v = chunk.split('').map((ch) => (ch === '=' ? 0 : TABLE.indexOf(ch)));
      const triple = (v[0] << 18) | (v[1] << 12) | (v[2] << 6) | v[3];
      bytes.push((triple >> 16) & 255);
      if (chunk[2] !== '=') bytes.push((triple >> 8) & 255);
      if (chunk[3] !== '=') bytes.push(triple & 255);
    }
    return new Uint8Array(bytes);
  }

  /**
   * @param {string}  text
   * @param {boolean} decode  true = Base64 → text, false = text → Base64
   * @returns {string}
   */
  function base64(text, decode) {
    if (!decode) return encodeBytes(C.utf8Encoder.encode(text));
    return C.utf8Decoder.decode(decodeToBytes(text));
  }

  Object.assign(C, { base64, BASE64_TABLE: TABLE });
})((typeof window !== 'undefined' ? window : globalThis).Ciphers);

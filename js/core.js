/**
 * =============================================================
 *  KriptoLab — core.js
 *  Shared helpers used by every cipher module.
 *
 *  All cipher modules register themselves on the global
 *  `Ciphers` namespace so they can be loaded with plain
 *  <script> tags (no build step, works offline and inside the
 *  desktop .exe).
 * =============================================================
 */
(function (global) {
  'use strict';

  /** The 26-letter English alphabet used by all classical ciphers. */
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /**
   * Mathematical modulo that always returns a non-negative result.
   * JavaScript's % operator keeps the sign of the dividend (-1 % 26 = -1),
   * but cryptography needs (-1 mod 26) = 25.
   * @param {number} n
   * @param {number} m
   * @returns {number}
   */
  const mod = (n, m) => ((n % m) + m) % m;

  const isUpper = (ch) => ch >= 'A' && ch <= 'Z';
  const isLower = (ch) => ch >= 'a' && ch <= 'z';
  const isLetter = (ch) => isUpper(ch) || isLower(ch);

  /**
   * Upper-cases a string and removes everything that is not A–Z.
   * Used by ciphers that work on pure letter streams (Playfair, Hill,
   * Transposition).
   * @param {string} s
   * @returns {string}
   */
  const onlyLetters = (s) => String(s).toUpperCase().replace(/[^A-Z]/g, '');

  /** Greatest common divisor (Euclid's algorithm). */
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a;
  }

  /**
   * Multiplicative inverse of a modulo m (a · x ≡ 1 mod m).
   * Brute force is fine because m is always 26 here.
   * @returns {number|null} the inverse, or null if it does not exist
   */
  function modInverse(a, m) {
    a = mod(a, m);
    for (let x = 1; x < m; x++) if ((a * x) % m === 1) return x;
    return null;
  }

  /* -------------------------------------------------------------
   *  Byte / text helpers (UTF-8 aware) used by XOR and Base64
   * ----------------------------------------------------------- */
  const utf8Encoder = new TextEncoder();
  const utf8Decoder = new TextDecoder('utf-8', { fatal: false });

  /** Uint8Array → lowercase hex string ("0a1bff…"). */
  const toHex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, '0')).join('');

  /** Hex string → Uint8Array. Spaces and other separators are ignored. */
  function fromHex(hex) {
    hex = String(hex).replace(/[^0-9a-fA-F]/g, '');
    if (hex.length % 2) throw cipherError('hexOdd');
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  /* -------------------------------------------------------------
   *  Bilingual error messages (Turkish / English)
   *  Cipher functions throw errors with a code; the message text is
   *  produced in the language currently selected in the UI.
   * ----------------------------------------------------------- */
  let lang = 'en';

  const MESSAGES = {
    monoLength: {
      tr: (p) => `Anahtar tam olarak 26 harf olmalı (şu an ${p.n}).`,
      en: (p) => `The key must contain exactly 26 letters (currently ${p.n}).`,
    },
    monoChars: { tr: () => 'Anahtar sadece A–Z harflerinden oluşmalı.', en: () => 'The key may only contain the letters A–Z.' },
    monoDup: {
      tr: () => 'Anahtarda her harf yalnızca bir kez geçmeli (permütasyon).',
      en: () => 'Each letter must appear exactly once in the key (a permutation).',
    },
    hillNoInverse: {
      tr: (p) => `Anahtar matrisin determinantı (mod 26 = ${p.d}) 26 ile aralarında asal değil, bu yüzden matrisin tersi yok. Başka bir matris deneyin.`,
      en: (p) => `det(K) mod 26 = ${p.d} is not coprime with 26, so the key matrix has no inverse. Try another matrix.`,
    },
    vigenereEmpty: { tr: () => 'Anahtar kelime en az bir harf içermeli.', en: () => 'The keyword must contain at least one letter.' },
    transNumeric: {
      tr: () => 'Sayısal anahtar 1..n arasındaki sayıların bir permütasyonu olmalı (örn: 4 3 1 2 5 6 7).',
      en: () => 'A numeric key must be a permutation of 1..n (e.g. 4 3 1 2 5 6 7).',
    },
    transShort: { tr: () => 'Anahtar en az 2 harf ya da bir sayı dizisi olmalı.', en: () => 'The key must be at least 2 letters or a sequence of numbers.' },
    transLength: {
      tr: (p) => `Şifreli metnin uzunluğu (${p.len}) anahtar uzunluğunun (${p.n}) katı olmalı.`,
      en: (p) => `The ciphertext length (${p.len}) must be a multiple of the key length (${p.n}).`,
    },
    xorEmptyKey: { tr: () => 'Anahtar boş olamaz.', en: () => 'The key cannot be empty.' },
    xorBlock: {
      tr: (p) => `Şifreli verinin uzunluğu ${p.b} baytın katı olmalı.`,
      en: (p) => `The ciphertext length must be a multiple of ${p.b} bytes.`,
    },
    xorPadding: {
      tr: () => 'Çözme başarısız: anahtar veya IV yanlış olabilir (dolgu doğrulanamadı).',
      en: () => 'Decryption failed: the key or IV is probably wrong (padding check failed).',
    },
    hexOdd: { tr: () => 'Geçersiz HEX: karakter sayısı çift olmalı.', en: () => 'Invalid HEX input: the number of digits must be even.' },
    base64Invalid: { tr: () => 'Geçersiz Base64 girdisi.', en: () => 'Invalid Base64 input.' },
  };

  /**
   * Creates an Error whose message is written in the active UI language.
   * @param {string} code key of MESSAGES
   * @param {object} [params] values inserted into the message
   */
  function cipherError(code, params = {}) {
    const entry = MESSAGES[code];
    const err = new Error(entry ? entry[lang](params) : code);
    err.code = code;
    return err;
  }

  /** Public namespace. Each cipher file adds its own functions to it. */
  global.Ciphers = {
    ALPHABET,
    A: ALPHABET,
    mod, gcd, modInverse,
    isUpper, isLower, isLetter, onlyLetters,
    utf8Encoder, utf8Decoder, toHex, fromHex,
    cipherError,
    setLang(l) { lang = l === 'tr' ? 'tr' : 'en'; },
  };
})(typeof window !== 'undefined' ? window : globalThis);

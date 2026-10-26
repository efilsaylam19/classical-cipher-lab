/**
 * =============================================================
 *  Monoalphabetic Substitution Cipher  (extra / bonus cipher)
 *
 *  The key is a permutation of the 26 letters:
 *      plaintext : a b c d e f ...
 *      ciphertext: t h i j a b ...
 *  Key space = 26! ≈ 4 × 10^26, yet it is easily broken by
 *  letter-frequency analysis because each plaintext letter always
 *  maps to the same ciphertext letter.
 * =============================================================
 */
(function (C) {
  'use strict';

  /**
   * Builds a key alphabet from a keyword: the keyword's letters first
   * (duplicates removed), followed by the remaining letters in order.
   * Example: "thijab" → "THIJABCDEFGKLMNOPQRSUVWXYZ"
   * @param {string} word
   * @returns {string} 26-letter key
   */
  function monoKeyFromKeyword(word) {
    const seen = new Set();
    let key = '';
    for (const ch of C.onlyLetters(word) + C.ALPHABET) {
      if (!seen.has(ch)) { seen.add(ch); key += ch; }
    }
    return key;
  }

  /** Random permutation of A–Z (Fisher–Yates shuffle). */
  function randomMonoKey() {
    const arr = C.ALPHABET.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }

  /**
   * Checks that a key is a valid permutation of A–Z.
   * @returns {string|null} an error message, or null when valid
   */
  function validateMonoKey(key) {
    key = String(key).toUpperCase();
    if (key.length !== 26) return C.cipherError('monoLength', { n: key.length }).message;
    if (!/^[A-Z]{26}$/.test(key)) return C.cipherError('monoChars').message;
    if (new Set(key).size !== 26) return C.cipherError('monoDup').message;
    return null;
  }

  /**
   * Encrypts / decrypts with a substitution alphabet.
   * @param {string}  text
   * @param {string}  key      26-letter permutation
   * @param {boolean} decrypt
   * @returns {string}
   */
  function mono(text, key, decrypt) {
    key = String(key).toUpperCase();
    const err = validateMonoKey(key);
    if (err) throw new Error(err);

    // Encryption maps ALPHABET → key, decryption maps key → ALPHABET.
    const from = decrypt ? key : C.ALPHABET;
    const to = decrypt ? C.ALPHABET : key;

    let out = '';
    for (const ch of text) {
      if (C.isUpper(ch)) out += to[from.indexOf(ch)];
      else if (C.isLower(ch)) out += to[from.indexOf(ch.toUpperCase())].toLowerCase();
      else out += ch;
    }
    return out;
  }

  Object.assign(C, { mono, monoKeyFromKeyword, randomMonoKey, validateMonoKey });
})((typeof window !== 'undefined' ? window : globalThis).Ciphers);

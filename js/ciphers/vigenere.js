/**
 * =============================================================
 *  Vigenère Cipher (polyalphabetic substitution)
 *
 *  The keyword is repeated to align with the plaintext. Every key
 *  letter selects a different Caesar shift (a = 0, b = 1, …):
 *
 *      Encryption:  Cᵢ = (Pᵢ + K_(i mod m)) mod 26
 *      Decryption:  Pᵢ = (Cᵢ − K_(i mod m)) mod 26
 *
 *  Non-letters are copied unchanged and do NOT consume a key letter.
 * =============================================================
 */
(function (C) {
  'use strict';

  /**
   * @param {string}  text
   * @param {string}  keyword  only its letters are used
   * @param {boolean} decrypt
   * @returns {{result:string, align:{p:string,k:string,c:string}[]}}
   *          `align` lists plaintext/key/ciphertext letters for the visualisation.
   */
  function vigenere(text, keyword, decrypt) {
    const key = C.onlyLetters(keyword);
    if (!key) throw C.cipherError('vigenereEmpty');

    let out = '';
    let ki = 0; // index into the (repeating) key
    const align = [];

    for (const ch of text) {
      if (!C.isLetter(ch)) { out += ch; continue; }

      const k = key.charCodeAt(ki % key.length) - 65;
      const shift = decrypt ? -k : k;
      const base = C.isUpper(ch) ? 65 : 97;
      const r = String.fromCharCode(C.mod(ch.charCodeAt(0) - base + shift, 26) + base);

      align.push({ p: ch.toUpperCase(), k: key[ki % key.length], c: r.toUpperCase() });
      out += r;
      ki++;
    }
    return { result: out, align };
  }

  C.vigenere = vigenere;
})((typeof window !== 'undefined' ? window : globalThis).Ciphers);

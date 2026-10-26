/**
 * =============================================================
 *  Caesar Cipher (generalised shift cipher)
 *
 *  Each letter is replaced by the letter k positions further down
 *  the alphabet. The historical Caesar cipher uses k = 3.
 *
 *      Encryption:  C = E(k, p) = (p + k) mod 26
 *      Decryption:  P = D(k, c) = (c − k) mod 26
 *
 *  Upper/lower case is preserved; non-letters (spaces, digits,
 *  punctuation) are copied unchanged.
 * =============================================================
 */
(function (C) {
  'use strict';

  /**
   * Encrypts or decrypts text with the Caesar cipher.
   * @param {string}  text     input text
   * @param {number}  k        shift amount (any integer, reduced mod 26)
   * @param {boolean} decrypt  true = decrypt, false = encrypt
   * @returns {string}
   */
  function caesar(text, k, decrypt) {
    k = C.mod(parseInt(k, 10) || 0, 26);
    if (decrypt) k = C.mod(-k, 26); // decrypting = shifting backwards

    let out = '';
    for (const ch of text) {
      if (C.isUpper(ch)) {
        out += C.ALPHABET[C.mod(ch.charCodeAt(0) - 65 + k, 26)];
      } else if (C.isLower(ch)) {
        out += C.ALPHABET[C.mod(ch.charCodeAt(0) - 97 + k, 26)].toLowerCase();
      } else {
        out += ch;
      }
    }
    return out;
  }

  /**
   * Brute-force attack: tries all 25 non-trivial keys on a ciphertext.
   * Demonstrates why a key space of 25 offers no security.
   * @param {string} ciphertext
   * @returns {{k:number, text:string}[]}
   */
  function caesarBruteForce(ciphertext) {
    const results = [];
    for (let k = 1; k < 26; k++) results.push({ k, text: caesar(ciphertext, k, true) });
    return results;
  }

  C.caesar = caesar;
  C.caesarBruteForce = caesarBruteForce;
})((typeof window !== 'undefined' ? window : globalThis).Ciphers);

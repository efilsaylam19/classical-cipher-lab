/**
 * =============================================================
 *  Playfair Cipher (digram substitution)
 *
 *  1. A 5 × 5 matrix is filled with the keyword (duplicates removed)
 *     followed by the rest of the alphabet. I and J share one cell.
 *  2. The plaintext is split into pairs. A filler letter (default X)
 *     is inserted between two identical letters in a pair and appended
 *     if the last pair is incomplete.
 *  3. Each pair is substituted using three rules:
 *       • same row     → take the letters to the RIGHT (wrap around)
 *       • same column  → take the letters BELOW (wrap around)
 *       • otherwise    → rectangle: each letter is replaced by the
 *                        letter in its own row and the other letter's
 *                        column
 *  Decryption applies the same rules in the opposite direction
 *  (left / above); the rectangle rule is its own inverse.
 * =============================================================
 */
(function (C) {
  'use strict';

  /**
   * Builds the 5 × 5 key matrix.
   * @param {string} keyword
   * @returns {string[][]} 5 rows of 5 letters (J is merged into I)
   */
  function playfairMatrix(keyword) {
    const seen = new Set();
    const letters = [];
    for (let ch of C.onlyLetters(keyword) + C.ALPHABET) {
      if (ch === 'J') ch = 'I';
      if (!seen.has(ch)) { seen.add(ch); letters.push(ch); }
    }
    const matrix = [];
    for (let r = 0; r < 5; r++) matrix.push(letters.slice(r * 5, r * 5 + 5));
    return matrix;
  }

  /**
   * Splits plaintext into digrams and inserts filler letters.
   * "balloon" → BA LX LO ON
   * @param {string} text
   * @param {string} filler single letter used as padding (default X)
   * @returns {string[]}
   */
  function playfairPrepare(text, filler) {
    filler = C.onlyLetters(filler || 'X')[0] || 'X';
    // If the letter itself equals the filler we need a different one (XX → XQ).
    const altFiller = filler === 'X' ? 'Q' : 'X';
    const s = C.onlyLetters(text).replace(/J/g, 'I');
    const pairs = [];
    let i = 0;
    while (i < s.length) {
      const a = s[i];
      let b = s[i + 1];
      if (b === undefined || a === b) {
        // Odd last letter or a repeated letter → pad and advance by one.
        b = a === filler ? altFiller : filler;
        i += 1;
      } else {
        i += 2;
      }
      pairs.push(a + b);
    }
    return pairs;
  }

  /**
   * Encrypts / decrypts with Playfair.
   * @param {string}  text
   * @param {string}  keyword
   * @param {boolean} decrypt
   * @param {string}  [filler='X']
   * @returns {{result:string, matrix:string[][], steps:{in:string,out:string,rule:'row'|'col'|'rect'}[]}}
   *          `steps` describes every pair for the visualisation.
   */
  function playfair(text, keyword, decrypt, filler) {
    const m = playfairMatrix(keyword);

    // Position lookup table: letter → [row, column]
    const pos = {};
    m.forEach((row, r) => row.forEach((ch, c) => (pos[ch] = [r, c])));

    const pairs = decrypt
      ? (C.onlyLetters(text).replace(/J/g, 'I').match(/.{1,2}/g) || []).map((p) => (p.length === 1 ? p + 'X' : p))
      : playfairPrepare(text, filler);

    const d = decrypt ? -1 : 1; // direction: +1 = right/down, −1 = left/up
    const steps = [];

    const out = pairs.map((p) => {
      const [r1, c1] = pos[p[0]];
      const [r2, c2] = pos[p[1]];
      let res, rule;
      if (r1 === r2) {
        res = m[r1][C.mod(c1 + d, 5)] + m[r2][C.mod(c2 + d, 5)];
        rule = 'row';
      } else if (c1 === c2) {
        res = m[C.mod(r1 + d, 5)][c1] + m[C.mod(r2 + d, 5)][c2];
        rule = 'col';
      } else {
        res = m[r1][c2] + m[r2][c1];
        rule = 'rect';
      }
      steps.push({ in: p, out: res, rule });
      return res;
    });

    return { result: out.join(''), matrix: m, steps };
  }

  Object.assign(C, { playfair, playfairMatrix, playfairPrepare });
})((typeof window !== 'undefined' ? window : globalThis).Ciphers);

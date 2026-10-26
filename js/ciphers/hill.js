/**
 * =============================================================
 *  Hill Cipher (linear algebra over Z_26)
 *
 *  Letters are mapped to numbers a = 0 … z = 25 and processed in
 *  blocks of n letters (n = 2 or 3). Each block is a column vector
 *  multiplied by the n × n key matrix K:
 *
 *      Encryption:  C = K · P   (mod 26)
 *      Decryption:  P = K⁻¹ · C (mod 26)
 *
 *  K is only usable when it is invertible modulo 26, i.e. when
 *  gcd(det(K), 26) = 1. The inverse is computed with the adjugate:
 *      K⁻¹ = det(K)⁻¹ · adj(K)   (mod 26)
 *  The last block is padded with X if needed.
 * =============================================================
 */
(function (C) {
  'use strict';

  /** Matrix with row r and column c removed. */
  function minor(M, r, c) {
    return M.filter((_, i) => i !== r).map((row) => row.filter((_, j) => j !== c));
  }

  /**
   * Determinant by cofactor (Laplace) expansion along the first row.
   * Sufficient for the small matrices used here.
   * @param {number[][]} M
   * @returns {number}
   */
  function det(M) {
    const n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
    let d = 0;
    for (let c = 0; c < n; c++) d += (c % 2 ? -1 : 1) * M[0][c] * det(minor(M, 0, c));
    return d;
  }

  /**
   * Inverse of K modulo 26.
   * @param {number[][]} K
   * @returns {number[][]|null} null when K is not invertible mod 26
   */
  function hillInverse(K) {
    const n = K.length;
    const d = C.mod(det(K), 26);
    const dInv = C.modInverse(d, 26);
    if (dInv === null || C.gcd(d, 26) !== 1) return null;

    const inv = [];
    for (let i = 0; i < n; i++) {
      inv.push([]);
      for (let j = 0; j < n; j++) {
        // adj(K)[i][j] = cofactor(K)[j][i]  (the adjugate is the transposed cofactor matrix)
        const cofactor = n === 1 ? 1 : ((i + j) % 2 ? -1 : 1) * det(minor(K, j, i));
        inv[i].push(C.mod(cofactor * dInv, 26));
      }
    }
    return inv;
  }

  /**
   * Encrypts / decrypts with the Hill cipher.
   * @param {string}     text
   * @param {number[][]} K        key matrix (2×2 or 3×3)
   * @param {boolean}    decrypt
   * @param {string}     [pad='X'] padding letter for the last block
   * @returns {{result:string, inverse:number[][]|null, det:number,
   *            blocks:{in:string,vin:number[],vout:number[],out:string}[], used:number[][]}}
   */
  function hill(text, K, decrypt, pad) {
    const n = K.length;
    pad = C.onlyLetters(pad || 'X')[0] || 'X';

    const d = C.mod(det(K), 26);
    if (C.gcd(d, 26) !== 1) throw C.cipherError('hillNoInverse', { d });

    const M = decrypt ? hillInverse(K) : K;

    let s = C.onlyLetters(text);
    while (s.length % n) s += pad;

    let out = '';
    const blocks = [];
    for (let i = 0; i < s.length; i += n) {
      // Block of letters → vector of numbers
      const P = s.slice(i, i + n).split('').map((ch) => ch.charCodeAt(0) - 65);
      // Matrix × vector, reduced mod 26
      const V = M.map((row) => C.mod(row.reduce((acc, v, j) => acc + v * P[j], 0), 26));
      const block = V.map((v) => C.ALPHABET[v]).join('');
      blocks.push({ in: s.slice(i, i + n), vin: P, vout: V, out: block });
      out += block;
    }
    return { result: out, inverse: hillInverse(K), det: d, blocks, used: M };
  }

  /** Random key matrix that is guaranteed to be invertible mod 26. */
  function randomHillKey(n) {
    let M;
    do {
      M = Array.from({ length: n }, () => Array.from({ length: n }, () => Math.floor(Math.random() * 26)));
    } while (C.gcd(C.mod(det(M), 26), 26) !== 1);
    return M;
  }

  Object.assign(C, { hill, hillInverse, det, randomHillKey });
})((typeof window !== 'undefined' ? window : globalThis).Ciphers);

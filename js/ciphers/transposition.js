/**
 * =============================================================
 *  Columnar Transposition Cipher (pure permutation)
 *
 *  The plaintext is written row by row into a matrix that has as
 *  many columns as the key. The ciphertext is obtained by reading
 *  the columns in the order given by the key.
 *
 *      key:        2 5 3 1 6 4
 *      → column 4 is read first (label 1), then column 1 (label 2) …
 *
 *  The key may be numbers ("2 5 3 1 6 4" / "4312567") or a word;
 *  a word is converted to numbers by alphabetical rank ("ZEBRAS" →
 *  6 3 2 4 1 5). Letters are never changed, only re-ordered, so the
 *  letter frequencies stay identical. Several rounds can be applied
 *  for more security. The last row is padded with X.
 * =============================================================
 */
(function (C) {
  'use strict';

  /**
   * Converts the user key into a column order.
   * @param {string} key
   * @returns {number[]} order[col] = position (1-based) in which that column is read
   */
  function parseTranspositionKey(key) {
    key = String(key).trim();

    if (/^[\d\s,]+$/.test(key)) {
      // Numeric key: "4312567" (single digits) or "2 5 3 1 6 4" / "2,5,3"
      const nums = (/^\d+$/.test(key) ? key.split('') : key.split(/[\s,]+/).filter(Boolean)).map(Number);
      const sorted = [...nums].sort((a, b) => a - b);
      if (!nums.length || sorted.some((v, i) => v !== i + 1)) throw C.cipherError('transNumeric');
      return nums;
    }

    // Keyword: rank letters alphabetically (ties broken left to right)
    const letters = C.onlyLetters(key);
    if (letters.length < 2) throw C.cipherError('transShort');
    const ranked = letters.split('')
      .map((ch, i) => ({ ch, i }))
      .sort((a, b) => (a.ch < b.ch ? -1 : a.ch > b.ch ? 1 : a.i - b.i));
    const order = new Array(letters.length);
    ranked.forEach((o, rank) => (order[o.i] = rank + 1));
    return order;
  }

  /**
   * @param {string}  text
   * @param {string}  key
   * @param {boolean} decrypt
   * @param {number}  [rounds=1]  number of times the permutation is applied (1–5)
   * @param {string}  [pad='X']
   * @returns {{result:string, grid:string[][], order:number[], readSeq:number[]}}
   *          `grid` is the matrix of the last round (for the visualisation)
   *          `readSeq` lists the column indices in reading order.
   */
  function transposition(text, key, decrypt, rounds, pad) {
    const order = parseTranspositionKey(key);
    const n = order.length;
    rounds = Math.max(1, Math.min(5, parseInt(rounds, 10) || 1));
    pad = C.onlyLetters(pad || 'X')[0] || 'X';

    // Column indices sorted by their label: the order in which columns are read.
    const readSeq = order
      .map((rank, col) => ({ rank, col }))
      .sort((a, b) => a.rank - b.rank)
      .map((o) => o.col);

    let s = C.onlyLetters(text);
    let grid = null;

    for (let r = 0; r < rounds; r++) {
      if (!decrypt) {
        // 1) write row by row
        while (s.length % n) s += pad;
        const rows = s.length / n;
        grid = [];
        for (let i = 0; i < rows; i++) grid.push(s.slice(i * n, i * n + n).split(''));
        // 2) read column by column in key order
        s = readSeq.map((c) => grid.map((row) => row[c]).join('')).join('');
      } else {
        if (s.length % n) throw C.cipherError('transLength', { len: s.length, n });
        const rows = s.length / n;
        grid = Array.from({ length: rows }, () => new Array(n));
        // 1) fill columns in key order
        let p = 0;
        readSeq.forEach((c) => { for (let i = 0; i < rows; i++) grid[i][c] = s[p++]; });
        // 2) read row by row
        s = grid.map((row) => row.join('')).join('');
      }
    }
    return { result: s, grid, order, readSeq };
  }

  Object.assign(C, { transposition, parseTranspositionKey });
})((typeof window !== 'undefined' ? window : globalThis).Ciphers);

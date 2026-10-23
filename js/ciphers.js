/* =========================================================
   KriptoLab — Klasik Şifreleme Algoritmaları
   Ders: Lecture 2 – Classical Encryption Techniques
   ========================================================= */
(function (global) {
  'use strict';

  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const mod = (n, m) => ((n % m) + m) % m;
  const isUpper = (ch) => ch >= 'A' && ch <= 'Z';
  const isLower = (ch) => ch >= 'a' && ch <= 'z';
  const isLetter = (ch) => isUpper(ch) || isLower(ch);
  const onlyLetters = (s) => s.toUpperCase().replace(/[^A-Z]/g, '');

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
  function modInverse(a, m) {
    a = mod(a, m);
    for (let x = 1; x < m; x++) if ((a * x) % m === 1) return x;
    return null;
  }

  /* ---------- 1. Caesar ---------- */
  function caesar(text, k, decrypt) {
    k = mod(parseInt(k, 10) || 0, 26);
    if (decrypt) k = mod(-k, 26);
    let out = '';
    for (const ch of text) {
      if (isUpper(ch)) out += A[mod(ch.charCodeAt(0) - 65 + k, 26)];
      else if (isLower(ch)) out += A[mod(ch.charCodeAt(0) - 97 + k, 26)].toLowerCase();
      else out += ch;
    }
    return out;
  }

  /* ---------- 2. Monoalphabetic ---------- */
  function monoKeyFromKeyword(word) {
    const seen = new Set();
    let key = '';
    for (const ch of onlyLetters(word) + A) if (!seen.has(ch)) { seen.add(ch); key += ch; }
    return key;
  }
  function randomMonoKey() {
    const arr = A.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }
  function validateMonoKey(key) {
    key = key.toUpperCase();
    if (key.length !== 26) return 'Anahtar tam olarak 26 harf olmalı (şu an ' + key.length + ').';
    if (!/^[A-Z]{26}$/.test(key)) return 'Anahtar sadece A–Z harflerinden oluşmalı.';
    if (new Set(key).size !== 26) return 'Anahtarda her harf yalnızca bir kez geçmeli (permütasyon).';
    return null;
  }
  function mono(text, key, decrypt) {
    key = key.toUpperCase();
    const err = validateMonoKey(key);
    if (err) throw new Error(err);
    const from = decrypt ? key : A;
    const to = decrypt ? A : key;
    let out = '';
    for (const ch of text) {
      if (isUpper(ch)) out += to[from.indexOf(ch)];
      else if (isLower(ch)) out += to[from.indexOf(ch.toUpperCase())].toLowerCase();
      else out += ch;
    }
    return out;
  }

  /* ---------- 3. Playfair ---------- */
  function playfairMatrix(keyword) {
    const seen = new Set();
    const letters = [];
    for (let ch of onlyLetters(keyword) + A) {
      if (ch === 'J') ch = 'I';
      if (!seen.has(ch)) { seen.add(ch); letters.push(ch); }
    }
    const m = [];
    for (let r = 0; r < 5; r++) m.push(letters.slice(r * 5, r * 5 + 5));
    return m;
  }
  function playfairPrepare(text, filler) {
    filler = (onlyLetters(filler || 'X')[0]) || 'X';
    const s = onlyLetters(text).replace(/J/g, 'I');
    const pairs = [];
    let i = 0;
    while (i < s.length) {
      const a = s[i];
      let b = s[i + 1];
      if (b === undefined) { b = a === filler ? (filler === 'X' ? 'Q' : 'X') : filler; i += 1; }
      else if (a === b) { b = a === filler ? (filler === 'X' ? 'Q' : 'X') : filler; i += 1; }
      else i += 2;
      pairs.push(a + b);
    }
    return pairs;
  }
  function playfair(text, keyword, decrypt, filler) {
    const m = playfairMatrix(keyword);
    const pos = {};
    m.forEach((row, r) => row.forEach((ch, c) => (pos[ch] = [r, c])));
    const pairs = decrypt
      ? (onlyLetters(text).replace(/J/g, 'I').match(/.{1,2}/g) || []).map((p) => (p.length === 1 ? p + 'X' : p))
      : playfairPrepare(text, filler);
    const d = decrypt ? -1 : 1;
    const steps = [];
    const out = pairs.map((p) => {
      const [r1, c1] = pos[p[0]];
      const [r2, c2] = pos[p[1]];
      let res, rule;
      if (r1 === r2) { res = m[r1][mod(c1 + d, 5)] + m[r2][mod(c2 + d, 5)]; rule = 'row'; }
      else if (c1 === c2) { res = m[mod(r1 + d, 5)][c1] + m[mod(r2 + d, 5)][c2]; rule = 'col'; }
      else { res = m[r1][c2] + m[r2][c1]; rule = 'rect'; }
      steps.push({ in: p, out: res, rule });
      return res;
    });
    return { result: out.join(''), matrix: m, steps };
  }

  /* ---------- 4. Hill ---------- */
  function det(M) {
    const n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
    let d = 0;
    for (let c = 0; c < n; c++) d += (c % 2 ? -1 : 1) * M[0][c] * det(minor(M, 0, c));
    return d;
  }
  function minor(M, r, c) {
    return M.filter((_, i) => i !== r).map((row) => row.filter((_, j) => j !== c));
  }
  function hillInverse(K) {
    const n = K.length;
    const d = mod(det(K), 26);
    const dInv = modInverse(d, 26);
    if (dInv === null || gcd(d, 26) !== 1) return null;
    const inv = [];
    for (let i = 0; i < n; i++) {
      inv.push([]);
      for (let j = 0; j < n; j++) {
        // adj[i][j] = cofactor[j][i]
        const cof = n === 1 ? 1 : ((i + j) % 2 ? -1 : 1) * det(minor(K, j, i));
        inv[i].push(mod(cof * dInv, 26));
      }
    }
    return inv;
  }
  function hill(text, K, decrypt, pad) {
    const n = K.length;
    pad = (onlyLetters(pad || 'X')[0]) || 'X';
    const d = mod(det(K), 26);
    if (gcd(d, 26) !== 1) throw new Error('Anahtar matrisin determinantı (mod 26 = ' + d + ') 26 ile aralarında asal değil → matrisin tersi yok. Başka bir matris deneyin.');
    const M = decrypt ? hillInverse(K) : K;
    let s = onlyLetters(text);
    while (s.length % n) s += pad;
    let out = '';
    const blocks = [];
    for (let i = 0; i < s.length; i += n) {
      const P = s.slice(i, i + n).split('').map((ch) => ch.charCodeAt(0) - 65);
      const C = M.map((row) => mod(row.reduce((acc, v, j) => acc + v * P[j], 0), 26));
      const block = C.map((v) => A[v]).join('');
      blocks.push({ in: s.slice(i, i + n), vin: P, vout: C, out: block });
      out += block;
    }
    return { result: out, inverse: hillInverse(K), det: d, blocks, used: M };
  }

  /* ---------- 5. Vigenère ---------- */
  function vigenere(text, keyword, decrypt) {
    const key = onlyLetters(keyword);
    if (!key) throw new Error('Anahtar kelime en az bir harf içermeli.');
    let out = '', ki = 0;
    const align = [];
    for (const ch of text) {
      if (isLetter(ch)) {
        const k = key.charCodeAt(ki % key.length) - 65;
        const shift = decrypt ? -k : k;
        const base = isUpper(ch) ? 65 : 97;
        const r = String.fromCharCode(mod(ch.charCodeAt(0) - base + shift, 26) + base);
        align.push({ p: ch.toUpperCase(), k: key[ki % key.length], c: r.toUpperCase() });
        out += r;
        ki++;
      } else out += ch;
    }
    return { result: out, align };
  }

  /* ---------- 6. Columnar Transposition ---------- */
  function parseTranspositionKey(key) {
    key = String(key).trim();
    let order;
    if (/^[\d\s,]+$/.test(key)) {
      const nums = (/^\d+$/.test(key) ? key.split('') : key.split(/[\s,]+/).filter(Boolean)).map(Number);
      const n = nums.length;
      const sorted = [...nums].sort((a, b) => a - b);
      if (!n || sorted.some((v, i) => v !== i + 1)) throw new Error('Sayısal anahtar 1..n arasındaki sayıların bir permütasyonu olmalı (örn: 4 3 1 2 5 6 7).');
      order = nums;
    } else {
      const letters = onlyLetters(key);
      if (letters.length < 2) throw new Error('Anahtar en az 2 harf ya da bir sayı dizisi olmalı.');
      const idx = letters.split('').map((ch, i) => ({ ch, i })).sort((a, b) => (a.ch < b.ch ? -1 : a.ch > b.ch ? 1 : a.i - b.i));
      order = new Array(letters.length);
      idx.forEach((o, rank) => (order[o.i] = rank + 1));
    }
    return order; // order[col] = sıradaki okuma numarası
  }
  function transposition(text, key, decrypt, rounds, pad) {
    const order = parseTranspositionKey(key);
    const n = order.length;
    rounds = Math.max(1, Math.min(5, parseInt(rounds, 10) || 1));
    pad = (onlyLetters(pad || 'X')[0]) || 'X';
    let s = onlyLetters(text);
    let grid = null;
    const readSeq = order.map((rank, col) => ({ rank, col })).sort((a, b) => a.rank - b.rank).map((o) => o.col);
    for (let r = 0; r < rounds; r++) {
      if (!decrypt) {
        while (s.length % n) s += pad;
        const rows = s.length / n;
        grid = [];
        for (let i = 0; i < rows; i++) grid.push(s.slice(i * n, i * n + n).split(''));
        s = readSeq.map((c) => grid.map((row) => row[c]).join('')).join('');
      } else {
        if (s.length % n) throw new Error('Şifreli metnin uzunluğu (' + s.length + ') anahtar uzunluğunun (' + n + ') katı olmalı.');
        const rows = s.length / n;
        grid = Array.from({ length: rows }, () => new Array(n));
        let p = 0;
        readSeq.forEach((c) => { for (let i = 0; i < rows; i++) grid[i][c] = s[p++]; });
        s = grid.map((row) => row.join('')).join('');
      }
    }
    return { result: s, grid, order, readSeq };
  }

  /* ---------- 7. Differential XOR (CBC benzeri) ---------- */
  const enc = new TextEncoder();
  const dec = new TextDecoder('utf-8', { fatal: false });
  function foldToBlock(str, size) {
    const bytes = enc.encode(str);
    const block = new Uint8Array(size);
    for (let i = 0; i < bytes.length; i++) block[i % size] ^= bytes[i];
    return block;
  }
  const toHex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, '0')).join('');
  function fromHex(hex) {
    hex = hex.replace(/[^0-9a-fA-F]/g, '');
    if (hex.length % 2) throw new Error('Geçersiz HEX: karakter sayısı çift olmalı.');
    const u = new Uint8Array(hex.length / 2);
    for (let i = 0; i < u.length; i++) u[i] = parseInt(hex.substr(i * 2, 2), 16);
    return u;
  }
  function diffXor(text, keyStr, ivStr, decrypt, blockSize) {
    const B = blockSize || 16;
    if (!keyStr) throw new Error('Anahtar boş olamaz.');
    const key = foldToBlock(keyStr, B);
    const iv = foldToBlock(ivStr || '', B);
    let data;
    if (decrypt) {
      data = fromHex(text);
      if (data.length % B) throw new Error('Şifreli verinin uzunluğu ' + B + ' baytın katı olmalı.');
    } else {
      const raw = enc.encode(text);
      const padLen = B - (raw.length % B); // PKCS#7 dolgu
      data = new Uint8Array(raw.length + padLen);
      data.set(raw);
      data.fill(padLen, raw.length);
    }
    const out = new Uint8Array(data.length);
    let prev = iv;
    const blocks = [];
    for (let i = 0; i < data.length; i += B) {
      const blk = data.slice(i, i + B);
      const res = new Uint8Array(B);
      for (let j = 0; j < B; j++) res[j] = blk[j] ^ key[j] ^ prev[j];
      blocks.push({ in: toHex(blk), prev: toHex(prev), out: toHex(res) });
      prev = decrypt ? blk : res;
      out.set(res, i);
    }
    if (decrypt) {
      const padLen = out[out.length - 1];
      let ok = padLen >= 1 && padLen <= B;
      for (let i = 0; ok && i < padLen; i++) if (out[out.length - 1 - i] !== padLen) ok = false;
      if (!ok) throw new Error('Çözme başarısız: anahtar veya IV yanlış olabilir (dolgu doğrulanamadı).');
      return { result: dec.decode(out.slice(0, out.length - padLen)), blocks, key: toHex(key), iv: toHex(iv) };
    }
    return { result: toHex(out).toUpperCase(), blocks, key: toHex(key), iv: toHex(iv) };
  }

  /* ---------- 8. Base64 ---------- */
  function base64(text, decrypt) {
    if (!decrypt) {
      const bytes = enc.encode(text);
      let bin = '';
      bytes.forEach((b) => (bin += String.fromCharCode(b)));
      return btoa(bin);
    }
    const clean = text.replace(/\s+/g, '');
    let bin;
    try { bin = atob(clean); } catch (e) { throw new Error('Geçersiz Base64 girdisi.'); }
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return dec.decode(u);
  }

  global.Ciphers = {
    A, mod, gcd, modInverse, onlyLetters, det,
    caesar,
    mono, monoKeyFromKeyword, randomMonoKey, validateMonoKey,
    playfair, playfairMatrix,
    hill, hillInverse,
    vigenere,
    transposition, parseTranspositionKey,
    diffXor,
    base64,
  };
})(typeof window !== 'undefined' ? window : globalThis);

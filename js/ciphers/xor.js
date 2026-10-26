/**
 * =============================================================
 *  XOR Cipher — two modes
 *
 *  XOR properties used:
 *      [A ⊕ B] ⊕ C = A ⊕ [B ⊕ C]      (associative)
 *      A ⊕ A = 0,   A ⊕ 0 = A          (self-inverse)
 *  Therefore (P ⊕ K) ⊕ K = P : the same operation encrypts and decrypts.
 *
 *  1) Simple (repeating-key) XOR
 *        Cᵢ = Pᵢ ⊕ K_(i mod m)
 *     Every byte of the UTF-8 text is XORed with the key bytes.
 *     Weakness: identical plaintext blocks give identical ciphertext.
 *
 *  2) Differential (chained) XOR — as described in the lecture
 *        C₀ = IV
 *        Cᵢ = Pᵢ ⊕ K ⊕ Cᵢ₋₁            (16-byte blocks)
 *        Pᵢ = Cᵢ ⊕ K ⊕ Cᵢ₋₁
 *     The output of each block depends on the previous block, so
 *     repetitive patterns disappear. The key and IV strings are
 *     folded into 16-byte blocks by XORing their bytes together.
 *     PKCS#7 padding fills the last block.
 *
 *  The ciphertext is shown as uppercase hexadecimal.
 * =============================================================
 */
(function (C) {
  'use strict';

  const BLOCK = 16;

  /** Folds any string into a fixed-size byte block (XOR of consecutive chunks). */
  function foldToBlock(str, size) {
    const bytes = C.utf8Encoder.encode(str);
    const block = new Uint8Array(size);
    for (let i = 0; i < bytes.length; i++) block[i % size] ^= bytes[i];
    return block;
  }

  /**
   * Simple repeating-key XOR.
   * @param {string}  text     plaintext (encrypt) or hex (decrypt)
   * @param {string}  keyStr
   * @param {boolean} decrypt
   * @returns {{result:string, bytes:{p:number,k:number,c:number}[], key:string}}
   */
  function simpleXor(text, keyStr, decrypt) {
    if (!keyStr) throw C.cipherError('xorEmptyKey');
    const key = C.utf8Encoder.encode(keyStr);
    const data = decrypt ? C.fromHex(text) : C.utf8Encoder.encode(text);
    const out = new Uint8Array(data.length);
    const bytes = [];
    for (let i = 0; i < data.length; i++) {
      out[i] = data[i] ^ key[i % key.length];
      if (bytes.length < 24) bytes.push({ p: data[i], k: key[i % key.length], c: out[i] });
    }
    return {
      result: decrypt ? C.utf8Decoder.decode(out) : C.toHex(out).toUpperCase(),
      bytes,
      key: C.toHex(key),
    };
  }

  /**
   * Differential (chained) XOR with 16-byte blocks.
   * @param {string}  text     plaintext (encrypt) or hex (decrypt)
   * @param {string}  keyStr
   * @param {string}  ivStr    initialisation vector text
   * @param {boolean} decrypt
   * @returns {{result:string, blocks:{in:string,prev:string,out:string}[], key:string, iv:string}}
   */
  function diffXor(text, keyStr, ivStr, decrypt) {
    if (!keyStr) throw C.cipherError('xorEmptyKey');
    const key = foldToBlock(keyStr, BLOCK);
    const iv = foldToBlock(ivStr || '', BLOCK);

    let data;
    if (decrypt) {
      data = C.fromHex(text);
      if (data.length % BLOCK) throw C.cipherError('xorBlock', { b: BLOCK });
    } else {
      // PKCS#7 padding: append N bytes of value N (1 ≤ N ≤ 16)
      const raw = C.utf8Encoder.encode(text);
      const padLen = BLOCK - (raw.length % BLOCK);
      data = new Uint8Array(raw.length + padLen);
      data.set(raw);
      data.fill(padLen, raw.length);
    }

    const out = new Uint8Array(data.length);
    let prev = iv; // C₀ = IV
    const blocks = [];
    for (let i = 0; i < data.length; i += BLOCK) {
      const blk = data.slice(i, i + BLOCK);
      const res = new Uint8Array(BLOCK);
      for (let j = 0; j < BLOCK; j++) res[j] = blk[j] ^ key[j] ^ prev[j];
      blocks.push({ in: C.toHex(blk), prev: C.toHex(prev), out: C.toHex(res) });
      // The chain always continues with the CIPHERTEXT block
      prev = decrypt ? blk : res;
      out.set(res, i);
    }

    if (decrypt) {
      // Verify and strip PKCS#7 padding — a wrong key/IV almost always fails here
      const padLen = out[out.length - 1];
      let ok = padLen >= 1 && padLen <= BLOCK;
      for (let i = 0; ok && i < padLen; i++) if (out[out.length - 1 - i] !== padLen) ok = false;
      if (!ok) throw C.cipherError('xorPadding');
      return { result: C.utf8Decoder.decode(out.slice(0, out.length - padLen)), blocks, key: C.toHex(key), iv: C.toHex(iv) };
    }
    return { result: C.toHex(out).toUpperCase(), blocks, key: C.toHex(key), iv: C.toHex(iv) };
  }

  Object.assign(C, { simpleXor, diffXor, foldToBlock });
})((typeof window !== 'undefined' ? window : globalThis).Ciphers);

/**
 * =============================================================
 *  KriptoLab — app.js
 *  User-interface controller.
 *
 *  Structure
 *   1. TECHS      – registry: one entry per cipher with its texts
 *                   (TR/EN), key controls, example and run() function
 *   2. Rendering  – sidebar, cipher header, key controls, output,
 *                   frequency chart
 *   3. Events     – mode switch, typing, key changes, swap, copy …
 *
 *  The cipher maths lives in js/ciphers/*.js and the panel drawings
 *  in js/ui/visualizations.js; this file only wires them together.
 * =============================================================
 */
(function () {
  'use strict';

  const C = window.Ciphers;
  const V = window.Viz;
  const I = window.I18N;
  const A = C.ALPHABET;
  const $ = (s, r = document) => r.querySelector(s);
  const t = (tr, en) => I.t(tr, en);
  const esc = V.esc;

  /**
   * Classical ciphers use the 26-letter English alphabet, so Turkish
   * letters are mapped to their closest Latin letter before processing.
   */
  const TR_MAP = { 'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U', 'â': 'a', 'Â': 'A', 'î': 'i', 'û': 'u' };
  const trNorm = (s) => s.replace(/[çÇğĞıİöÖşŞüÜâÂîû]/g, (c) => TR_MAP[c]);

  /** Application state */
  const state = {
    tech: 'caesar',   // selected cipher id
    mode: 'enc',      // 'enc' | 'dec'
    keys: {},         // current key settings per cipher
    sel: 0,           // selected pair/block in the visualisation
  };

  const DEFAULT_HILL_3 = [[17, 21, 2], [17, 18, 2], [5, 21, 19]];
  const DEFAULT_HILL_2 = [[3, 3], [2, 5]];
  const MONO_EXAMPLE = C.monoKeyFromKeyword('thijab');

  /* =============================================================
   *  1. CIPHER REGISTRY
   * =========================================================== */
  const GROUPS = {
    sub: { tr: 'Yer değiştirme', en: 'Substitution' },
    poly: { tr: 'Çok harfli', en: 'Polygraphic' },
    polyalpha: { tr: 'Çok alfabeli', en: 'Polyalphabetic' },
    trans: { tr: 'Yer değiştirme sırası', en: 'Transposition' },
    modern: { tr: 'Bit düzeyinde / kodlama', en: 'Bitwise & encoding' },
  };

  const TECHS = [
    /* ----------------------------- Caesar ----------------------------- */
    {
      id: 'caesar', group: 'sub', icon: 'Cæ',
      name: { tr: 'Caesar Şifresi', en: 'Caesar Cipher' },
      short: { tr: 'Kaydırmalı şifre', en: 'Shift cipher' },
      tag: { tr: 'Monoalfabetik · Yer değiştirme', en: 'Monoalphabetic · Substitution' },
      desc: {
        tr: 'Bilinen en eski yer değiştirme şifresi. Her harf, alfabede <b>k</b> konum ilerideki harfle değiştirilir. Orijinal Caesar şifresinde k = 3’tür.',
        en: 'The earliest known substitution cipher. Each letter is replaced by the letter <b>k</b> positions further down the alphabet. The original Caesar cipher uses k = 3.',
      },
      formula: ['<b>C</b> = E(k, p) = (p + <em>k</em>) mod 26', '<b>P</b> = D(k, c) = (c − <em>k</em>) mod 26'],
      security: {
        tr: ['Anahtar uzayı yalnızca 25, bu yüzden kaba kuvvet saldırısıyla anında kırılır.', 'Monoalfabetik olduğu için harf frekansları aynen korunur.', 'Görselleştirmede 25 anahtarın hepsinin denendiği saldırıyı görebilirsiniz.'],
        en: ['The key space is only 25, so a brute-force attack breaks it instantly.', 'Being monoalphabetic, it preserves letter frequencies exactly.', 'The visualisation shows the attack that tries all 25 keys.'],
      },
      keyspace: { tr: '<b>25</b> olası anahtar', en: '<b>25</b> possible keys' },
      defaults: { k: 3 },
      example: { text: 'are you ready', keys: { k: 3 } },
      keysHTML: (k) => `
        <div class="field" style="flex:2">
          <label>${t('Kaydırma miktarı (k)', 'Shift (k)')}</label>
          <input type="range" min="0" max="25" value="${k.k}" data-key="k" />
        </div>
        <div class="shift-val" id="shiftVal">${k.k}</div>`,
      run(text, dec, k) {
        const result = C.caesar(trNorm(text), k.k, dec);
        return { result, viz: V.caesar({ letters: C.onlyLetters(trNorm(text)), k: +k.k, dec }) };
      },
      freq: true,
    },

    /* -------------------------- Monoalphabetic ------------------------- */
    {
      id: 'mono', group: 'sub', icon: 'Mα', extra: true,
      name: { tr: 'Monoalfabetik Şifre', en: 'Monoalphabetic Cipher' },
      short: { tr: 'Ek · rastgele permütasyon', en: 'Extra · random permutation' },
      tag: { tr: 'Monoalfabetik · Yer değiştirme', en: 'Monoalphabetic · Substitution' },
      desc: {
        tr: 'Alfabedeki 26 harfin <b>rastgele bir permütasyonu</b> anahtar olarak kullanılır. Her düz metin harfi her zaman aynı şifreli harfe eşlenir.',
        en: 'A <b>random permutation</b> of the 26 letters is used as the key. Every plaintext letter is always mapped to the same ciphertext letter.',
      },
      formula: ['a b c d e f … → <em>t h i j a b</em> …', 'Key = permutation of 26 letters'],
      security: {
        tr: ['Anahtar uzayı 26! ≈ 4 × 10²⁶, DES’in 2⁵⁶ ≈ 7.2 × 10¹⁶ anahtar uzayından bile büyük.', 'Yine de kırılabilir: harf, digram ve trigram frekansları korunduğu için istatistiksel saldırıya açıktır.', 'Frekans grafiğinde girdi ve çıktının aynı “şekle” sahip olduğuna dikkat edin.'],
        en: ['The key space is 26! ≈ 4 × 10²⁶, even larger than DES (2⁵⁶ ≈ 7.2 × 10¹⁶).', 'It is still breakable: letter, digram and trigram frequencies survive, so a statistical attack works.', 'Notice that input and output have the same “shape” in the frequency chart.'],
      },
      keyspace: { tr: '<b>26! ≈ 4 × 10²⁶</b> olası anahtar', en: '<b>26! ≈ 4 × 10²⁶</b> possible keys' },
      defaults: { key: MONO_EXAMPLE, word: 'thijab' },
      example: { text: 'attack at dawn, the enemy is near', keys: { key: MONO_EXAMPLE, word: 'thijab' } },
      keysHTML: (k) => {
        const err = C.validateMonoKey(k.key);
        return `
        <div class="field" style="flex:3">
          <label>${t('Anahtar alfabe (26 harf)', 'Key alphabet (26 letters)')}</label>
          <input type="text" maxlength="26" value="${esc(k.key)}" data-key="key" style="letter-spacing:2px;text-transform:uppercase" />
          <span class="key-status ${err ? 'bad' : 'ok'}">${err ? '✗ ' + esc(err) : '✓ ' + t('Geçerli permütasyon', 'Valid permutation')}</span>
        </div>
        <div class="field">
          <label>${t('Anahtar kelimeden üret', 'Generate from keyword')}</label>
          <input type="text" value="${esc(k.word || '')}" data-key="word" placeholder="${t('ör. kriptoloji', 'e.g. cryptology')}" />
          <span class="hint">${t('Kelime + kalan harfler sırasıyla', 'Keyword + remaining letters in order')}</span>
        </div>
        <div class="field narrow"><label>&nbsp;</label><button class="ghost" data-action="random">${t('Rastgele', 'Random')}</button><span class="hint">&nbsp;</span></div>`;
      },
      onKey(name, val, k) {
        if (name === 'word') { k.word = val; k.key = C.monoKeyFromKeyword(val); return true; }
        if (name === 'key') { k.key = val.toUpperCase().replace(/[^A-Z]/g, ''); return true; }
        return false;
      },
      rerenderOn: ['key', 'word'],
      action(name, k) { if (name === 'random') { k.key = C.randomMonoKey(); k.word = ''; } },
      run(text, dec, k) {
        const result = C.mono(trNorm(text), k.key, dec);
        return { result, viz: V.mono({ letters: C.onlyLetters(trNorm(text)), key: k.key.toUpperCase(), dec }) };
      },
      freq: true,
    },

    /* ----------------------------- Playfair ---------------------------- */
    {
      id: 'playfair', group: 'poly', icon: 'Pf',
      name: { tr: 'Playfair Şifresi', en: 'Playfair Cipher' },
      short: { tr: '5×5 matris, ikili', en: '5×5 matrix, digrams' },
      tag: { tr: 'Çok harfli · Digram', en: 'Polygraphic · Digram' },
      desc: {
        tr: 'Harfleri <b>ikişer ikişer</b> şifreler. Anahtar kelime ve alfabe 5×5 bir matrise yerleştirilir (I/J aynı hücreyi paylaşır). Tekrar eden harflerin arasına dolgu harfi (X) eklenir.',
        en: 'Encrypts letters <b>two at a time</b>. The keyword and the alphabet fill a 5×5 matrix (I/J share a cell). A filler letter (X) is inserted between repeating letters.',
      },
      formula: {
        tr: ['Aynı satır → <em>sağdaki</em> harf (dairesel)', 'Aynı sütun → <em>alttaki</em> harf (dairesel)', 'Diğer → aynı satır, <em>diğer harfin sütunu</em>'],
        en: ['Same row → letter to the <em>right</em> (circular)', 'Same column → letter <em>below</em> (circular)', 'Otherwise → same row, <em>other letter’s column</em>'],
      },
      security: {
        tr: ['On yıllarca kırılamaz sanıldı; 1. Dünya Savaşı’nda İngiliz, 2. Dünya Savaşı’nda ABD ordusu kullandı.', 'Yine de kolayca kırılır: frekansları değiştirir ama yeterince değil.', 'Ters digramlar kriptanalize yardım eder: AB → XY ise BA → YX.'],
        en: ['Thought unbreakable for decades; used by the British Army in WW1 and the U.S. Army in WW2.', 'Still easily broken: it alters frequencies, but not sufficiently.', 'Reversed digrams aid cryptanalysis: if AB → XY then BA → YX.'],
      },
      keyspace: { tr: '<b>25! ≈ 1.55 × 10²⁵</b> olası matris', en: '<b>25! ≈ 1.55 × 10²⁵</b> possible matrices' },
      defaults: { key: 'smythework', filler: 'X' },
      example: { text: 'meet me at midnight', keys: { key: 'smythework', filler: 'X' } },
      keysHTML: (k) => `
        <div class="field" style="flex:3"><label>${t('Anahtar kelime', 'Keyword')}</label><input type="text" value="${esc(k.key)}" data-key="key" /></div>
        <div class="field narrow"><label>${t('Dolgu harfi', 'Filler letter')}</label><input type="text" maxlength="1" value="${esc(k.filler)}" data-key="filler" style="text-transform:uppercase" /></div>`,
      run(text, dec, k) {
        const r = C.playfair(trNorm(text), k.key, dec, k.filler);
        return { result: r.result, viz: V.playfair({ r, dec, keyword: k.key, sel: state.sel }) };
      },
      freq: true,
    },

    /* ------------------------------- Hill ------------------------------ */
    {
      id: 'hill', group: 'poly', icon: 'H',
      name: { tr: 'Hill Şifresi', en: 'Hill Cipher' },
      short: { tr: 'Matris çarpımı mod 26', en: 'Matrix multiplication mod 26' },
      tag: { tr: 'Çok harfli · Lineer cebir', en: 'Polygraphic · Linear algebra' },
      desc: {
        tr: 'Çok harfli yer değiştirmeye matematiksel yaklaşım. Harflere 0–25 arası sayılar atanır (a = 0 … z = 25) ve harfler <b>n’er n’er</b> (2 veya 3) bir anahtar matrisle çarpılır.',
        en: 'A mathematical approach to multi-letter substitution. Letters become numbers 0–25 (a = 0 … z = 25) and are multiplied by a key matrix <b>n letters at a time</b> (n = 2 or 3).',
      },
      formula: ['<b>C</b> = [<em>K</em>] · P mod 26', '<b>P</b> = [<em>K⁻¹</em>] · C mod 26'],
      security: {
        tr: ['Yalnızca şifreli metin saldırısına karşı çok güvenli (büyük anahtar uzayı).', 'Düz metin–şifreli metin çiftleri biliniyorsa güvenlik sıfırdır: anahtar matris bu çiftlerden kolayca hesaplanır.', 'Anahtar matrisin mod 26’da tersi olmalı: det(K) ile 26 aralarında asal olmalı.'],
        en: ['Very secure against ciphertext-only attacks (large key space).', 'Zero security when plaintext–ciphertext pairs are known: the key matrix is easily computed from them.', 'The key matrix must be invertible mod 26: det(K) must be coprime with 26.'],
      },
      keyspace: { tr: '3×3 için <b>≈ 1.6 × 10¹²</b> tersinir matris', en: '<b>≈ 1.6 × 10¹²</b> invertible 3×3 matrices' },
      defaults: { n: 3, M: DEFAULT_HILL_3 },
      example: { text: 'paymoremoney', keys: { n: 3, M: DEFAULT_HILL_3 } },
      keysHTML: (k) => `
        <div class="field narrow"><label>${t('Matris boyutu', 'Matrix size')}</label>
          <select data-key="n"><option value="2" ${k.n === 2 ? 'selected' : ''}>2 × 2</option><option value="3" ${k.n === 3 ? 'selected' : ''}>3 × 3</option></select>
          <button class="ghost sm" data-action="randomHill" style="margin-top:6px">${t('Rastgele K', 'Random K')}</button>
        </div>
        <div class="field" style="flex:0 0 auto"><label>${t('Anahtar matris K', 'Key matrix K')}</label>
          <div class="matrix-input" style="grid-template-columns:repeat(${k.n},60px)">
            ${k.M.map((row, i) => row.map((v, j) => `<input type="number" min="0" max="25" value="${v}" data-cell="${i},${j}" />`).join('')).join('')}
          </div>
        </div>
        <div class="field"><label>${t('Tersinirlik', 'Invertibility')}</label>
          ${hillStatusHTML(k.M)}
          <span class="hint">${t('Eksik blok sonuna X eklenir.', 'An incomplete last block is padded with X.')}</span>
        </div>`,
      onKey(name, val, k) {
        if (name === 'n') { k.n = +val; k.M = JSON.parse(JSON.stringify(k.n === 2 ? DEFAULT_HILL_2 : DEFAULT_HILL_3)); return true; }
        return false;
      },
      rerenderOn: ['n'],
      action(name, k) { if (name === 'randomHill') k.M = C.randomHillKey(k.n); },
      run(text, dec, k) {
        const r = C.hill(trNorm(text), k.M, dec);
        return { result: r.result, viz: V.hill({ r, K: k.M, dec, sel: state.sel }) };
      },
      freq: true,
    },

    /* ----------------------------- Vigenère ---------------------------- */
    {
      id: 'vigenere', group: 'polyalpha', icon: 'V',
      name: { tr: 'Vigenère Şifresi', en: 'Vigenère Cipher' },
      short: { tr: 'Anahtar kelimeli Caesar', en: 'Keyword-driven Caesar' },
      tag: { tr: 'Polialfabetik · Yer değiştirme', en: 'Polyalphabetic · Substitution' },
      desc: {
        tr: 'Yer değiştirme kuralı <b>her karakterde değişir</b>. Anahtar düz metinle hizalanır (gerekirse tekrarlanır) ve her anahtar harfi ayrı bir Caesar kaydırmasını belirtir.',
        en: 'The substitution rule <b>changes with each character</b>. The key is aligned with the plaintext (repeated if necessary) and each key letter denotes a different Caesar shift.',
      },
      formula: ['<b>Cᵢ</b> = (Pᵢ + <em>K<sub>i mod m</sub></em>) mod 26', '<b>Pᵢ</b> = (Cᵢ − <em>K<sub>i mod m</sub></em>) mod 26'],
      security: {
        tr: ['Her düz metin harfi için birden fazla şifreli harf olması frekansları maskeler.', 'Anahtar uzadıkça maskeleme iyileşir; ideal olan düz metin kadar uzun ve tamamen rastgele bir anahtardır.', 'Kırma yöntemi: Kasiski incelemesi. Tekrar eden diziler arasındaki mesafelerden anahtar uzunluğu tahmin edilir.'],
        en: ['Multiple ciphertext letters for each plaintext letter mask the frequencies.', 'A longer key masks better; ideally the key is as long as the plaintext and purely random.', 'Breaking method: Kasiski examination — distances between repeated sequences reveal the key length.'],
      },
      keyspace: { tr: 'Anahtar uzunluğu m için <b>26<sup>m</sup></b>', en: '<b>26<sup>m</sup></b> for a key of length m' },
      defaults: { key: 'abracadabra' },
      example: { text: 'canyoumeetmeatmidnightihavethegoods', keys: { key: 'abracadabra' } },
      keysHTML: (k) => `<div class="field"><label>${t('Anahtar kelime', 'Keyword')}</label><input type="text" value="${esc(k.key)}" data-key="key" />
        <span class="hint">${t('Yalnızca A–Z harfleri kullanılır; harf olmayan karakterler korunur.', 'Only the letters A–Z are used; non-letters are kept as they are.')}</span></div>`,
      run(text, dec, k) {
        const r = C.vigenere(trNorm(text), k.key, dec);
        return { result: r.result, viz: V.vigenere({ align: r.align }) };
      },
      freq: true,
    },

    /* --------------------------- Transposition ------------------------- */
    {
      id: 'transposition', group: 'trans', icon: 'T',
      name: { tr: 'Transpozisyon Şifresi', en: 'Transposition Cipher' },
      short: { tr: 'Sütunlu permütasyon', en: 'Columnar permutation' },
      tag: { tr: 'Transpozisyon · Permütasyon', en: 'Transposition · Permutation' },
      desc: {
        tr: 'Saf permütasyon şifresi: harfler <b>değişmez, sadece yerleri değişir</b>. Düz metin satır satır bir matrise yazılır, sütunlar anahtardaki sıraya göre okunur. Birden çok tur ile daha güvenli hale gelir.',
        en: 'A pure permutation cipher: letters <b>are not changed, only re-ordered</b>. The plaintext is written row by row into a matrix and the columns are read in key order. Multiple rounds make it more secure.',
      },
      formula: {
        tr: ['Satırlara yaz → sütunları <em>anahtar sırasıyla</em> oku', 'Anahtar: 2 5 3 1 6 4 ya da bir kelime'],
        en: ['Write in rows → read columns <em>in key order</em>', 'Key: 2 5 3 1 6 4 or a keyword'],
      },
      security: {
        tr: ['Harf frekansları hiç değişmez; frekans grafiğinde girdi ve çıktı birebir aynıdır.', 'Bu yüzden düz metnin dili kolayca anlaşılır; tek turlu transpozisyon zayıftır.', 'Birden çok tur uygulamak güvenliği artırır.'],
        en: ['Letter frequencies do not change at all; input and output are identical in the frequency chart.', 'The plaintext language is therefore easy to recognise; a single round is weak.', 'Applying multiple rounds increases security.'],
      },
      keyspace: { tr: 'n sütun için <b>n!</b> anahtar', en: '<b>n!</b> keys for n columns' },
      defaults: { key: '2 5 3 1 6 4', rounds: 1 },
      example: { text: 'meet me at midnight for the goodies', keys: { key: '2 5 3 1 6 4', rounds: 1 } },
      keysHTML: (k) => `
        <div class="field" style="flex:3"><label>${t('Anahtar (sayılar veya kelime)', 'Key (numbers or keyword)')}</label><input type="text" value="${esc(k.key)}" data-key="key" />
          <span class="hint">${t('Ör: “2 5 3 1 6 4”, “4312567” veya “ZEBRAS”', 'e.g. “2 5 3 1 6 4”, “4312567” or “ZEBRAS”')}</span></div>
        <div class="field narrow"><label>${t('Tur sayısı', 'Rounds')}</label><select data-key="rounds">${[1, 2, 3, 4, 5].map((n) => `<option ${+k.rounds === n ? 'selected' : ''}>${n}</option>`).join('')}</select>
          <span class="hint">${t('Eksikler X ile doldurulur', 'Padded with X')}</span></div>`,
      run(text, dec, k) {
        const r = C.transposition(trNorm(text), k.key, dec, k.rounds);
        return { result: r.result, viz: V.transposition({ r, dec, rounds: k.rounds, sel: state.sel }) };
      },
      freq: true,
    },

    /* ------------------------------- XOR ------------------------------- */
    {
      id: 'xor', group: 'modern', icon: '⊕',
      name: { tr: 'XOR Şifresi', en: 'XOR Cipher' },
      short: { tr: 'Basit ve zincirleme XOR', en: 'Simple & chained XOR' },
      tag: { tr: 'Bit düzeyinde · XOR', en: 'Bitwise · XOR' },
      desc: {
        tr: 'XOR’un özelliklerine dayanır: aynı anahtarla iki kez XOR’lamak düz metni geri verir. <b>Basit</b> modda her bayt anahtarın baytıyla XOR’lanır. <b>Zincirleme (diferansiyel)</b> modda her 16 baytlık blok ayrıca bir önceki şifreli blokla XOR’lanır, böylece tekrar eden kalıplar yok olur.',
        en: 'Based on the properties of XOR: XORing twice with the same key returns the plaintext. In <b>simple</b> mode every byte is XORed with a key byte. In <b>chained (differential)</b> mode every 16-byte block is also XORed with the previous ciphertext block, so repeating patterns disappear.',
      },
      formula: ['[A ⊕ B] ⊕ C = A ⊕ [B ⊕ C]', 'A ⊕ A = 0 · A ⊕ 0 = A', '<b>Cᵢ</b> = Pᵢ ⊕ <em>K</em> ⊕ Cᵢ₋₁ (C₀ = IV)'],
      security: {
        tr: ['Basit XOR’da aynı düz metin her zaman aynı şifreli metni verir; kısa anahtar tekrar ettiği için kırılabilir.', 'Diferansiyel XOR’da her bloğun çıktısı bir önceki bloğa bağlıdır; tekrar eden kalıplar yok olur.', 'Çıktı HEX biçimindedir; Türkçe karakterler dahil tüm UTF-8 metinler desteklenir.'],
        en: ['With simple XOR the same plaintext always gives the same ciphertext; a short repeating key can be broken.', 'With differential XOR every output block depends on the previous one, destroying repetitive patterns.', 'The output is hexadecimal; any UTF-8 text (including Turkish characters) is supported.'],
      },
      keyspace: { tr: 'Zincirleme mod: 16 baytlık blok anahtarı, <b>2¹²⁸</b>', en: 'Chained mode: 16-byte block key, <b>2¹²⁸</b>' },
      defaults: { mode: 'chained', key: 'cryptology', iv: 'Hopes and dreams of a million years' },
      example: {
        text: 'This line repeats.This line repeats.This line repeats.',
        keys: { mode: 'chained', key: 'cryptology', iv: 'Hopes and dreams of a million years' },
      },
      keysHTML: (k) => `
        <div class="field narrow" style="flex:0 0 240px"><label>${t('Mod', 'Mode')}</label>
          <select data-key="mode">
            <option value="simple" ${k.mode === 'simple' ? 'selected' : ''}>${t('Basit (tekrarlı anahtar)', 'Simple (repeating key)')}</option>
            <option value="chained" ${k.mode === 'chained' ? 'selected' : ''}>${t('Zincirleme (diferansiyel)', 'Chained (differential)')}</option>
          </select></div>
        <div class="field"><label>${t('Anahtar', 'Key')}</label><input type="text" value="${esc(k.key)}" data-key="key" /></div>
        ${k.mode === 'chained' ? `<div class="field"><label>${t('Başlangıç vektörü (IV)', 'Initialisation vector (IV)')}</label><input type="text" value="${esc(k.iv)}" data-key="iv" /></div>` : ''}`,
      rerenderOn: ['mode'],
      run(text, dec, k) {
        if (k.mode === 'simple') {
          const r = C.simpleXor(text, k.key, dec);
          return { result: r.result, viz: V.xorSimple({ r, dec }) };
        }
        const r = C.diffXor(text, k.key, k.iv, dec);
        return { result: r.result, viz: V.xorChained({ r, dec }) };
      },
      freq: false,
      freqNote: {
        tr: 'XOR baytlar üzerinde çalışır ve çıktı HEX’tir. Zincirleme modda tekrar eden girdilerin bile çıktıda tekrar etmediğine bakın.',
        en: 'XOR works on bytes and its output is hexadecimal. In chained mode, notice that even repeated input does not repeat in the output.',
      },
    },

    /* ------------------------------ Base64 ----------------------------- */
    {
      id: 'base64', group: 'modern', icon: '64',
      name: { tr: 'Base64 Kodlama', en: 'Base64 Encoding' },
      short: { tr: '6 bitlik gruplar', en: '6-bit groups' },
      tag: { tr: 'Kodlama · Encoding', en: 'Encoding · Decoding' },
      desc: {
        tr: 'Ders notlarındaki “Swahili açısı”: düz metnin biçimi bilinmiyorsa basit bir dönüşüm bile onu gizler. Base64 her seferinde <b>6 biti</b> yazdırılabilir bir karaktere çevirir (A–Z, a–z, 0–9, +, /). E-posta ekleri bu şekilde taşınır.',
        en: 'The “Swahili angle” from the lecture: if the format of the plaintext is unknown, even a simple transformation hides it. Base64 encodes <b>6 bits</b> at a time into a printable character (A–Z, a–z, 0–9, +, /). E-mail attachments are sent this way.',
      },
      formula: { tr: ['3 bayt (24 bit) → 4 × <em>6 bit</em> → 4 karakter', 'Küme: A–Z a–z 0–9 + /'], en: ['3 bytes (24 bits) → 4 × <em>6 bits</em> → 4 characters', 'Set: A–Z a–z 0–9 + /'] },
      security: {
        tr: ['Base64 bir şifreleme değil, bir kodlamadır; anahtarı yoktur.', 'Amaç, yazdırılamayan karakterlerin internet iletişiminde bozulmasını önlemektir.', '“Tüm internet iletişimi karakter tabanlıdır” sloganının pratik karşılığıdır.'],
        en: ['Base64 is an encoding, not encryption — there is no key.', 'Its purpose is to keep non-printable bytes from being corrupted in transit.', 'It is the practical side of the slogan “all internet communications are character based”.'],
      },
      keyspace: { tr: '<b>Anahtar yok</b>, yalnızca kodlama', en: '<b>No key</b> — encoding only' },
      defaults: {},
      example: { text: 'Hello World! Merhaba Dünya!', keys: {} },
      keysHTML: () => `<div class="field"><span class="hint" style="font-size:13px">${t('Bu teknik anahtar kullanmaz. UTF-8 (Türkçe karakterler) desteklenir.', 'This technique uses no key. UTF-8 text (including Turkish letters) is supported.')}</span></div>`,
      run(text, dec) {
        const result = C.base64(text, dec);
        return { result, viz: V.base64({ plain: dec ? result : text }) };
      },
      freq: false,
      freqNote: { tr: 'Base64 harfler değil bit grupları üzerinde çalışır; frekans analizi burada anlamlı değildir.', en: 'Base64 works on bit groups rather than letters, so frequency analysis is not meaningful here.' },
    },
  ];

  const byId = Object.fromEntries(TECHS.map((x) => [x.id, x]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  TECHS.forEach((x) => (state.keys[x.id] = clone(x.defaults)));

  /** Status label for the Hill key matrix. */
  function hillStatusHTML(M) {
    const d = C.mod(C.det(M), 26);
    const ok = C.gcd(d, 26) === 1;
    return `<span class="key-status ${ok ? 'ok' : 'bad'}">det(K) mod 26 = ${d} → ${ok ? '✓ ' + t('tersi var', 'invertible') : '✗ ' + t('tersi yok (gcd ≠ 1)', 'not invertible (gcd ≠ 1)')}</span>`;
  }

  /* =============================================================
   *  2. RENDERING
   * =========================================================== */

  /** Left navigation, grouped by cipher family. */
  function renderSidebar() {
    let html = '', g = '';
    TECHS.forEach((x, i) => {
      if (x.group !== g) { g = x.group; html += `<div class="group">${I.pick(GROUPS[g])}</div>`; }
      html += `<button class="tech ${x.id === state.tech ? 'active' : ''}" data-tech="${x.id}">
        <span class="ico">${x.icon}</span>
        <span><b>${I.pick(x.name)}</b><small>${String(i + 1).padStart(2, '0')} · ${I.pick(x.short)}</small></span></button>`;
    });
    $('#techList').innerHTML = html;
    $('#techList').setAttribute('aria-label', I.ui('navLabel'));
  }

  /** Header (name, description, formulas) and security notes of the selected cipher. */
  function renderTech(animate = true) {
    const x = byId[state.tech];
    const i = TECHS.indexOf(x);
    $('#techTag').textContent = I.pick(x.tag);
    $('#techNum').textContent = `${String(i + 1).padStart(2, '0')} / ${String(TECHS.length).padStart(2, '0')}`;
    $('#techName').textContent = I.pick(x.name);
    $('#techDesc').innerHTML = I.pick(x.desc);
    const formula = Array.isArray(x.formula) ? x.formula : I.pick(x.formula);
    $('#techFormula').innerHTML = formula.map((f) => `<code>${f}</code>`).join('');
    $('#techSec').innerHTML = I.pick(x.security).map((s) => `<li>${s}</li>`).join('');
    $('#keyspace').innerHTML = `${I.ui('keyspace')}: ${I.pick(x.keyspace)}`;
    if (animate) {
      const hero = $('#hero');
      hero.classList.remove('anim-in'); void hero.offsetWidth; hero.classList.add('anim-in');
    }
    $('#freqChart').innerHTML = '';
    renderKeys();
  }

  function renderKeys() {
    const x = byId[state.tech];
    $('#keyArea').innerHTML = x.keysHTML(state.keys[x.id]);
  }

  /** Short "scramble" animation when a new result appears. */
  let scrambleTimer = null;
  function setOutput(text, animate) {
    const el = $('#output');
    clearInterval(scrambleTimer);
    if (!animate || !text || text.length > 700) { el.textContent = text; return; }
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let frame = 0;
    const total = 8;
    scrambleTimer = setInterval(() => {
      frame++;
      const reveal = Math.floor((frame / total) * text.length);
      let s = text.slice(0, reveal);
      for (let i = reveal; i < text.length; i++) s += /\s/.test(text[i]) ? text[i] : pool[(Math.random() * pool.length) | 0];
      el.textContent = s;
      if (frame >= total) { clearInterval(scrambleTimer); el.textContent = text; }
    }, 25);
  }

  /** Relative letter frequencies (A–Z) of a text. */
  function letterFrequencies(s) {
    const L = C.onlyLetters(trNorm(s));
    const f = new Array(26).fill(0);
    for (const ch of L) f[ch.charCodeAt(0) - 65]++;
    return L.length ? f.map((v) => v / L.length) : f;
  }

  /** Input-vs-output frequency bar chart. */
  function renderFreq(input, output, x) {
    const el = $('#freqChart');
    if (!x.freq) {
      el.classList.add('note');
      el.innerHTML = `<p class="freq-note">${I.pick(x.freqNote)}</p>`;
      return;
    }
    el.classList.remove('note');
    const fi = letterFrequencies(input), fo = letterFrequencies(output);
    const max = Math.max(0.0001, ...fi, ...fo);
    if (!el.querySelector('.col')) {
      el.innerHTML = A.split('').map((ch) => `<div class="col"><div class="bars"><div class="bar in"></div><div class="bar out"></div></div><span class="lab">${ch}</span></div>`).join('');
    }
    el.querySelectorAll('.col').forEach((col, i) => {
      col.querySelector('.in').style.height = (fi[i] / max) * 100 + '%';
      col.querySelector('.out').style.height = (fo[i] / max) * 100 + '%';
      col.title = `${A[i]} · ${I.ui('input')} ${(fi[i] * 100).toFixed(1)}% · ${I.ui('output')} ${(fo[i] * 100).toFixed(1)}%`;
    });
  }

  /** Runs the selected cipher on the input and refreshes every output panel. */
  function update(animate = true) {
    const x = byId[state.tech];
    const dec = state.mode === 'dec';
    const text = $('#input').value;

    const isB64 = x.id === 'base64';
    $('#inLabel').textContent = I.ui(dec ? (isB64 ? 'encoded' : 'ciphertext') : 'plaintext');
    $('#outLabel').textContent = I.ui(dec ? 'decrypted' : (isB64 ? 'encoded' : 'ciphertext'));
    $('#inCount').textContent = `${text.length} ${I.ui('chars')}`;

    const err = $('#error');
    try {
      const r = x.run(text, dec, state.keys[x.id]);
      err.hidden = true;
      setOutput(r.result, animate);
      $('#outCount').textContent = `${r.result.length} ${I.ui('chars')}`;
      $('#viz').innerHTML = r.viz;
      renderFreq(text, r.result, x);
    } catch (e) {
      err.hidden = false;
      err.textContent = e.message;
      setOutput('', false);
      $('#outCount').textContent = `0 ${I.ui('chars')}`;
      $('#viz').innerHTML = `<div class="viz-empty">${I.ui('waiting')}</div>`;
      renderFreq(text, '', x);
    }
  }

  function setMode(m) {
    state.mode = m;
    document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
    $('.mode').classList.toggle('dec', m === 'dec');
    state.sel = 0;
    update();
  }

  function setLang(l) {
    I.lang = l;
    C.setLang(l);
    try { localStorage.setItem('kriptolab-lang', l); } catch (_) { /* storage unavailable */ }
    document.querySelectorAll('.lang-btn').forEach((b) => b.classList.toggle('active', b.dataset.lang === l));
    I.apply();
    renderSidebar();
    renderTech(false);
    update(false);
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 1600);
  }

  /** Loads the lecture example for the current cipher. */
  function loadExample(withToast = true) {
    const x = byId[state.tech];
    state.keys[x.id] = Object.assign(clone(x.defaults), clone(x.example.keys));
    $('#input').value = x.example.text;
    state.sel = 0;
    renderKeys();
    setMode('enc');
    if (withToast) toast(I.ui('toastExample'));
  }

  /* =============================================================
   *  3. EVENTS
   * =========================================================== */
  $('#techList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tech]');
    if (!b) return;
    state.tech = b.dataset.tech;
    state.sel = 0;
    renderSidebar();
    renderTech();
    if (!$('#input').value.trim()) loadExample(false);
    update();
  });

  document.querySelectorAll('.mode-btn').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  document.querySelectorAll('.lang-btn').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

  $('#input').addEventListener('input', () => { state.sel = 0; update(); });

  const keyArea = $('#keyArea');
  keyArea.addEventListener('input', (e) => {
    const x = byId[state.tech];
    const k = state.keys[x.id];
    const el = e.target;

    // Hill matrix cell
    if (el.dataset.cell) {
      const [i, j] = el.dataset.cell.split(',').map(Number);
      k.M[i][j] = C.mod(parseInt(el.value, 10) || 0, 26);
      keyArea.querySelector('.key-status').outerHTML = hillStatusHTML(k.M);
      update(false);
      return;
    }

    const name = el.dataset.key;
    if (!name) return;
    const val = el.type === 'range' ? +el.value : el.value;

    // Cipher-specific handling first, otherwise store the raw value
    const handled = x.onKey ? x.onKey(name, val, k) : false;
    if (!handled) k[name] = name === 'rounds' ? +val : val;

    // Some inputs change the layout of the key panel → re-render and keep the caret
    if (x.rerenderOn && x.rerenderOn.includes(name)) {
      const caret = el.selectionStart;
      renderKeys();
      const again = keyArea.querySelector(`[data-key="${name}"]`);
      if (again && again.tagName === 'INPUT') { again.focus(); try { again.setSelectionRange(caret, caret); } catch (_) { /* not a text input */ } }
    }
    if (x.id === 'caesar') $('#shiftVal').textContent = val;
    update(x.id !== 'caesar');
  });

  keyArea.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const x = byId[state.tech];
    x.action(b.dataset.action, state.keys[x.id]);
    renderKeys();
    update();
  });

  // Clicking a pair / block / column in the visualisation selects it
  $('#viz').addEventListener('click', (e) => {
    const s = e.target.closest('[data-sel]');
    if (!s) return;
    state.sel = +s.dataset.sel;
    update(false);
  });

  // Swap: the output becomes the new input and the mode is reversed
  $('#swapBtn').addEventListener('click', () => {
    const x = byId[state.tech];
    let result;
    try { result = x.run($('#input').value, state.mode === 'dec', state.keys[x.id]).result; } catch (_) { return; }
    if (!result) return;
    clearInterval(scrambleTimer);
    $('#input').value = result;
    setMode(state.mode === 'enc' ? 'dec' : 'enc');
    toast(I.ui(state.mode === 'dec' ? 'toastNowDec' : 'toastNowEnc'));
  });

  $('#copyBtn').addEventListener('click', async () => {
    const x = byId[state.tech];
    let txt = '';
    try { txt = x.run($('#input').value, state.mode === 'dec', state.keys[x.id]).result; } catch (_) { /* invalid key */ }
    if (!txt) return;
    try { await navigator.clipboard.writeText(txt); } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (__) { /* ignore */ }
      ta.remove();
    }
    toast(I.ui('toastCopied'));
  });

  $('#clearBtn').addEventListener('click', () => { $('#input').value = ''; update(); $('#input').focus(); });
  $('#exampleBtn').addEventListener('click', () => loadExample());

  /* =============================================================
   *  START
   * =========================================================== */
  let lang = 'en';
  try { lang = localStorage.getItem('kriptolab-lang') || 'en'; } catch (_) { /* storage unavailable */ }
  const params = new URLSearchParams(location.search);
  if (params.get('lang')) lang = params.get('lang');
  if (params.get('cipher') && byId[params.get('cipher')]) state.tech = params.get('cipher');

  I.lang = lang;
  C.setLang(lang);
  document.querySelectorAll('.lang-btn').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
  I.apply();
  renderSidebar();
  renderTech(false);
  loadExample(false);
})();

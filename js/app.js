/* =========================================================
   KriptoLab — Arayüz
   ========================================================= */
(function () {
  'use strict';
  const C = window.Ciphers;
  const A = C.A;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Türkçe harfleri 26 harfli alfabeye indir (klasik şifreler İngilizce alfabe kullanır)
  const TR = { 'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U', 'â': 'a', 'Â': 'A', 'î': 'i', 'û': 'u' };
  const trNorm = (s) => s.replace(/[çÇğĞıİöÖşŞüÜâÂîû]/g, (c) => TR[c]);

  const state = { tech: 'caesar', mode: 'enc', keys: {}, sel: 0 };

  /* ---------------- Teknik tanımları ---------------- */
  const TECHS = [
    {
      id: 'caesar', group: 'Yer değiştirme (Substitution)', name: 'Caesar Şifresi', short: 'Kaydırmalı şifre', icon: 'Cæ',
      tag: 'Monoalfabetik · Substitution',
      desc: 'Bilinen en eski yer değiştirme şifresi. Her harf, alfabede <b>k</b> konum ilerideki harfle değiştirilir. Orijinal Caesar şifresinde k = 3’tür.',
      formula: ['<b>C</b> = E(k, p) = (p + <em>k</em>) mod 26', '<b>P</b> = D(k, c) = (c − <em>k</em>) mod 26'],
      security: ['Anahtar uzayı yalnızca 25 → kaba kuvvet (brute-force) saldırısıyla anında kırılır.', 'Monoalfabetik olduğu için harf frekansları aynen korunur.', 'Aşağıdaki görselleştirmede tüm 25 anahtarın denendiği saldırıyı görebilirsiniz.'],
      keyspace: '<b>25</b> olası anahtar',
      defaults: { k: 3 },
      example: { text: 'are you ready', keys: { k: 3 } },
      keysHTML: (k) => `
        <div class="field" style="flex:2">
          <label>Kaydırma miktarı (k)</label>
          <input type="range" min="0" max="25" value="${k.k}" data-key="k" />
        </div>
        <div class="shift-val" id="shiftVal">${k.k}</div>`,
      run(text, dec, k) {
        const r = C.caesar(trNorm(text), k.k, dec);
        return { result: r, viz: vizCaesar(text, k.k, dec) };
      },
      freq: true,
    },
    {
      id: 'mono', group: 'Yer değiştirme (Substitution)', name: 'Monoalfabetik Şifre', short: 'Rastgele permütasyon', icon: 'Mα',
      tag: 'Monoalfabetik · Substitution',
      desc: 'Alfabedeki 26 harfin <b>rastgele bir permütasyonu</b> anahtar olarak kullanılır. Her düz metin harfi her zaman aynı şifreli harfe eşlenir.',
      formula: ['a b c d e f … → <em>t h i j a b</em> …', 'Anahtar = 26 harfin permütasyonu'],
      security: ['Anahtar uzayı 26! ≈ 4 × 10²⁶ — DES’in 2⁵⁶ ≈ 7.2 × 10¹⁶ anahtar uzayından bile büyük.', 'Ama yine de kırılabilir! Harf, digram (th, he, an…) ve trigram (the, and, ent…) frekansları korunduğu için istatistiksel saldırıya açıktır.', 'Frekans grafiğinde girdi ve çıktının aynı “şekle” sahip olduğuna dikkat edin.'],
      keyspace: '<b>26! ≈ 4 × 10²⁶</b> olası anahtar',
      defaults: { key: C.monoKeyFromKeyword('thijab'), word: 'thijab' },
      example: { text: 'attack at dawn, the enemy is near', keys: { key: C.monoKeyFromKeyword('thijab'), word: 'thijab' } },
      keysHTML: (k) => {
        const err = C.validateMonoKey(k.key);
        return `
        <div class="field" style="flex:3">
          <label>Anahtar alfabe (26 harf)</label>
          <input type="text" maxlength="26" value="${esc(k.key)}" data-key="key" style="letter-spacing:2px;text-transform:uppercase" />
          <span class="key-status ${err ? 'bad' : 'ok'}">${err ? '✗ ' + esc(err) : '✓ Geçerli permütasyon'}</span>
        </div>
        <div class="field">
          <label>Anahtar kelimeden üret</label>
          <input type="text" value="${esc(k.word || '')}" data-key="word" placeholder="ör. kriptoloji" />
          <span class="hint">Kelime + kalan harfler sırasıyla</span>
        </div>
        <div class="field narrow"><label>&nbsp;</label><button class="ghost" data-action="random">Rastgele</button><span class="hint">&nbsp;</span></div>`;
      },
      onKey(name, val, k) {
        if (name === 'word') k.key = C.monoKeyFromKeyword(val);
        if (name === 'key') k.key = val.toUpperCase().replace(/[^A-Z]/g, '');
      },
      action(name, k) { if (name === 'random') { k.key = C.randomMonoKey(); k.word = ''; } },
      run(text, dec, k) {
        const r = C.mono(trNorm(text), k.key, dec);
        return { result: r, viz: vizMono(text, k.key, dec) };
      },
      freq: true,
    },
    {
      id: 'playfair', group: 'Çok harfli (Multi-character)', name: 'Playfair Şifresi', short: '5×5 matris, ikili', icon: 'Pf',
      tag: 'Çok harfli · Digram',
      desc: 'Harfleri <b>ikişer ikişer</b> şifreler. Anahtar kelime ve alfabe 5×5 bir matrise yerleştirilir (I/J aynı hücreyi paylaşır). Tekrar eden harflerin arasına dolgu harfi (X) eklenir.',
      formula: ['Aynı satır → <em>sağdaki</em> harf (dairesel)', 'Aynı sütun → <em>alttaki</em> harf (dairesel)', 'Diğer → aynı satır, <em>diğer harfin sütunu</em>'],
      security: ['On yıllarca kırılamaz sanıldı; 1. Dünya Savaşı’nda İngiliz, 2. Dünya Savaşı’nda ABD ordusu kullandı.', 'Yine de kolayca kırılır: frekansları değiştirir ama yeterince değil.', 'Ters digramlar kriptanalize yardım eder: AB → XY ise BA → YX.'],
      keyspace: '<b>25! ≈ 1.55 × 10²⁵</b> olası matris',
      defaults: { key: 'smythework', filler: 'X' },
      example: { text: 'meet me at midnight', keys: { key: 'smythework', filler: 'X' } },
      keysHTML: (k) => `
        <div class="field" style="flex:3"><label>Anahtar kelime</label><input type="text" value="${esc(k.key)}" data-key="key" /></div>
        <div class="field narrow"><label>Dolgu harfi</label><input type="text" maxlength="1" value="${esc(k.filler)}" data-key="filler" style="text-transform:uppercase" /></div>`,
      run(text, dec, k) {
        const r = C.playfair(trNorm(text), k.key, dec, k.filler);
        return { result: r.result, viz: vizPlayfair(r, dec) };
      },
      freq: true,
    },
    {
      id: 'hill', group: 'Çok harfli (Multi-character)', name: 'Hill Şifresi', short: 'Matris çarpımı mod 26', icon: 'H',
      tag: 'Çok harfli · Lineer cebir',
      desc: 'Çok harfli yer değiştirmeye matematiksel yaklaşım. Harflere 0–25 arası sayılar atanır (a = 0 … z = 25) ve harfler <b>n’er n’er</b> (burada 2 veya 3) bir anahtar matrisle çarpılır.',
      formula: ['<b>C</b> = [<em>K</em>] · P mod 26', '<b>P</b> = [<em>K⁻¹</em>] · C mod 26'],
      security: ['Yalnızca şifreli metin saldırısına (ciphertext-only) karşı çok güvenli — büyük anahtar uzayı.', 'Düz metin–şifreli metin çiftleri biliniyorsa güvenlik SIFIR: anahtar matris bu çiftlerden kolayca hesaplanır.', 'Anahtar matrisin mod 26’da tersi olmalı: det(K) ile 26 aralarında asal olmalı.'],
      keyspace: '3×3 için <b>≈ 1.6 × 10¹²</b> tersinir matris',
      defaults: { n: 3, M: [[17, 21, 2], [17, 18, 2], [5, 21, 19]] },
      example: { text: 'paymoremoney', keys: { n: 3, M: [[17, 21, 2], [17, 18, 2], [5, 21, 19]] } },
      keysHTML: (k) => {
        const d = C.mod(C.det(k.M), 26);
        const ok = C.gcd(d, 26) === 1;
        return `
        <div class="field narrow"><label>Matris boyutu</label>
          <select data-key="n"><option value="2" ${k.n === 2 ? 'selected' : ''}>2 × 2</option><option value="3" ${k.n === 3 ? 'selected' : ''}>3 × 3</option></select>
          <button class="ghost sm" data-action="randomHill" style="margin-top:6px">Rastgele K</button>
        </div>
        <div class="field" style="flex:0 0 auto"><label>Anahtar matris K</label>
          <div class="matrix-input" style="grid-template-columns:repeat(${k.n},64px)">
            ${k.M.map((row, i) => row.map((v, j) => `<input type="number" min="0" max="25" value="${v}" data-cell="${i},${j}" />`).join('')).join('')}
          </div>
        </div>
        <div class="field"><label>Tersinirlik</label>
          <span class="key-status ${ok ? 'ok' : 'bad'}">det(K) mod 26 = ${d} → ${ok ? '✓ tersi var' : '✗ tersi yok (gcd ≠ 1)'}</span>
          <span class="hint">Eksik blok sonuna X eklenir.</span>
        </div>`;
      },
      onKey(name, val, k) {
        if (name === 'n') {
          k.n = +val;
          k.M = k.n === 2 ? [[3, 3], [2, 5]] : [[17, 21, 2], [17, 18, 2], [5, 21, 19]];
        }
      },
      action(name, k) {
        if (name === 'randomHill') {
          let M;
          do { M = Array.from({ length: k.n }, () => Array.from({ length: k.n }, () => Math.floor(Math.random() * 26))); }
          while (C.gcd(C.mod(C.det(M), 26), 26) !== 1);
          k.M = M;
        }
      },
      run(text, dec, k) {
        const r = C.hill(trNorm(text), k.M, dec);
        return { result: r.result, viz: vizHill(r, k.M, dec) };
      },
      freq: true,
    },
    {
      id: 'vigenere', group: 'Çok alfabeli (Polyalphabetic)', name: 'Vigenère Şifresi', short: 'Anahtar kelimeli Caesar', icon: 'V',
      tag: 'Polialfabetik · Substitution',
      desc: 'Yer değiştirme kuralı <b>her karakterde değişir</b>. Anahtar düz metinle hizalanır (gerekirse tekrarlanır) ve her anahtar harfi ayrı bir Caesar kaydırmasını belirtir.',
      formula: ['<b>Cᵢ</b> = (Pᵢ + <em>Kᵢ mod m</em>) mod 26', '<b>Pᵢ</b> = (Cᵢ − <em>Kᵢ mod m</em>) mod 26'],
      security: ['Her düz metin harfi için birden fazla şifreli harf olması frekansları maskeler.', 'Anahtar ne kadar uzunsa maskeleme o kadar iyi; ideal: düz metin kadar uzun ve tamamen rastgele anahtar.', 'Kırma yöntemi: Kasiski incelemesi — tekrar eden diziler arasındaki mesafelerden anahtar uzunluğu tahmin edilir.'],
      keyspace: 'Anahtar uzunluğu m için <b>26ᵐ</b>',
      defaults: { key: 'abracadabra' },
      example: { text: 'canyoumeetmeatmidnightihavethegoods', keys: { key: 'abracadabra' } },
      keysHTML: (k) => `<div class="field"><label>Anahtar kelime</label><input type="text" value="${esc(k.key)}" data-key="key" /><span class="hint">Yalnızca A–Z harfleri kullanılır; harf olmayan karakterler korunur.</span></div>`,
      run(text, dec, k) {
        const r = C.vigenere(trNorm(text), k.key, dec);
        return { result: r.result, viz: vizVigenere(r.align) };
      },
      freq: true,
    },
    {
      id: 'transposition', group: 'Yer değiştirme sırası (Transposition)', name: 'Sütunlu Transpozisyon', short: 'Permütasyon şifresi', icon: 'T',
      tag: 'Transposition · Permütasyon',
      desc: 'Saf permütasyon şifresi: harfler <b>değişmez, sadece yerleri değişir</b>. Düz metin satır satır bir matrise yazılır, sütunlar anahtardaki sıraya göre okunur. Birden çok tur ile daha güvenli hale gelir.',
      formula: ['Satırlara yaz → sütunları <em>anahtar sırasıyla</em> oku', 'Anahtar: 2 5 3 1 6 4 ya da bir kelime'],
      security: ['Harf frekansları hiç değişmez — frekans grafiğinde girdi ve çıktı birebir aynıdır.', 'Bu yüzden düz metnin dili kolayca anlaşılır; tek turlu transpozisyon zayıftır.', 'Birden çok tur (multiple rounds) uygulamak güvenliği artırır.'],
      keyspace: 'n sütun için <b>n!</b> anahtar',
      defaults: { key: '2 5 3 1 6 4', rounds: 1 },
      example: { text: 'meet me at midnight for the goodies', keys: { key: '2 5 3 1 6 4', rounds: 1 } },
      keysHTML: (k) => `
        <div class="field" style="flex:3"><label>Anahtar (sayılar veya kelime)</label><input type="text" value="${esc(k.key)}" data-key="key" /><span class="hint">Ör: “2 5 3 1 6 4”, “4312567” veya “ZEBRAS”</span></div>
        <div class="field narrow"><label>Tur sayısı</label><select data-key="rounds">${[1, 2, 3, 4, 5].map((n) => `<option ${+k.rounds === n ? 'selected' : ''}>${n}</option>`).join('')}</select><span class="hint">Eksikler X ile doldurulur</span></div>`,
      run(text, dec, k) {
        const r = C.transposition(trNorm(text), k.key, dec, k.rounds);
        return { result: r.result, viz: vizTransposition(r, dec, k.rounds) };
      },
      freq: true,
    },
    {
      id: 'xor', group: 'Modern yaklaşım', name: 'Diferansiyel XOR', short: 'Blok zincirleme XOR', icon: '⊕',
      tag: 'Blok şifre · XOR zincirleme',
      desc: 'XOR’un özelliklerine dayanır. Metin 16 baytlık bloklara ayrılır; her blok anahtarla <b>ve bir önceki şifreli blokla</b> XOR’lanır. Böylece her çıktı bloğu öncekine bağlı olur ve tekrar eden kalıplar yok olur.',
      formula: ['[A ⊕ B] ⊕ C = A ⊕ [B ⊕ C]', 'A ⊕ A = 0 &nbsp;·&nbsp; A ⊕ 0 = A', '<b>Cᵢ</b> = Pᵢ ⊕ <em>K</em> ⊕ Cᵢ₋₁ &nbsp;(C₀ = IV)'],
      security: ['Diferansiyel XOR: her bloğun çıktısı bir önceki bloğa bağlıdır.', 'Tekrar eden kalıpları yok eder — aynı iki satırı yazıp şifreleyin, çıktıların farklı olduğunu görün.', 'Çıktı HEX biçimindedir; Türkçe karakterler dahil tüm UTF-8 metinler desteklenir.'],
      keyspace: '16 baytlık blok anahtarı: <b>2¹²⁸</b>',
      defaults: { key: 'kriptoloji', iv: 'Hopes and dreams of a million years' },
      example: { text: 'Bu satır tekrar ediyor.Bu satır tekrar ediyor.Bu satır tekrar ediyor.', keys: { key: 'kriptoloji', iv: 'Hopes and dreams of a million years' } },
      keysHTML: (k) => `
        <div class="field"><label>Anahtar (passphrase)</label><input type="text" value="${esc(k.key)}" data-key="key" /></div>
        <div class="field"><label>Başlangıç vektörü (IV)</label><input type="text" value="${esc(k.iv)}" data-key="iv" /></div>`,
      run(text, dec, k) {
        const r = C.diffXor(text, k.key, k.iv, dec, 16);
        return { result: r.result, viz: vizXor(r, dec) };
      },
      freq: false,
      freqNote: 'XOR baytlar üzerinde çalışır, çıktı HEX’tir. Tekrar eden girdilerin bile çıktıda tekrar etmediğine bakın.',
    },
    {
      id: 'base64', group: 'Modern yaklaşım', name: 'Base64 Kodlama', short: '“Swahili açısı”', icon: '64',
      tag: 'Kodlama · Encoding',
      desc: 'Ders notlarındaki “Swahili açısı”: düz metnin yapısı bilinmiyorsa basit bir dönüşüm bile zorlaşır. Base64 her seferinde <b>6 biti</b> yazdırılabilir bir karaktere çevirir (A–Z, a–z, 0–9, + , /). E-posta ekleri böyle taşınır.',
      formula: ['3 bayt (24 bit) → 4 × <em>6 bit</em> → 4 karakter', 'Küme: A–Z a–z 0–9 + /'],
      security: ['Base64 bir şifreleme DEĞİL, bir kodlamadır — anahtarı yoktur.', 'Amaç: yazdırılamayan karakterlerin internet iletişiminde bozulmasını önlemek.', '“Tüm internet iletişimi karakter tabanlıdır” sloganının pratik karşılığı.'],
      keyspace: '<b>Anahtar yok</b> — sadece kodlama',
      defaults: {},
      example: { text: 'Merhaba Dünya! Şifreleme çok eğlenceli.', keys: {} },
      keysHTML: () => `<div class="field"><span class="hint" style="font-size:13px">Bu teknik anahtar kullanmaz. UTF-8 (Türkçe karakterler) desteklenir.</span></div>`,
      run(text, dec) {
        const r = C.base64(text, dec);
        return { result: r, viz: vizBase64(dec ? r : text) };
      },
      freq: false,
      freqNote: 'Base64 harf değil bit grupları üzerinde çalışır; frekans analizi burada anlamlı değil.',
    },
  ];
  const byId = Object.fromEntries(TECHS.map((t) => [t.id, t]));
  TECHS.forEach((t) => (state.keys[t.id] = JSON.parse(JSON.stringify(t.defaults))));

  /* ---------------- Görselleştirmeler ---------------- */
  function vizCaesar(text, k, dec) {
    k = +k;
    const used = new Set(C.onlyLetters(trNorm(text)));
    const step = 360 / 26, R1 = 100, R2 = 72, c = 115;
    const ring = (r, cls, rot) => `<g class="${cls}" style="transform:rotate(${rot}deg)">${A.split('').map((ch, i) => {
      const a = (i * step - 90) * Math.PI / 180;
      return `<text x="${c + r * Math.cos(a)}" y="${c + r * Math.sin(a)}" transform="rotate(${i * step} ${c + r * Math.cos(a)} ${c + r * Math.sin(a)})">${ch}</text>`;
    }).join('')}</g>`;
    const map = A.split('').map((ch, i) => {
      const from = dec ? A[(i + k) % 26] : ch;
      const to = dec ? ch : A[(i + k) % 26];
      return `<div class="cell ${used.has(from) ? 'hit' : ''}"><span class="p">${from}</span><span class="arrow">▼</span><span class="c">${to}</span></div>`;
    }).join('');
    let brute = '';
    const sample = (C.onlyLetters(trNorm(text)).slice(0, 26)) || '';
    if (sample) {
      const base = dec ? sample : C.caesar(sample, k);
      brute = `<div class="sub-title">Kaba kuvvet saldırısı · şifreli metne tüm anahtarları dene</div><div class="brute">${
        Array.from({ length: 25 }, (_, i) => i + 1).map((s) => `<div class="${s === k ? 'me' : ''}"><b>k=${String(s).padStart(2, '0')}</b>${esc(C.caesar(base, s, true).toLowerCase())}</div>`).join('')}</div>`;
    }
    return `<div class="wheel-wrap">
        <svg class="wheel" viewBox="0 0 230 230">
          <circle cx="115" cy="115" r="112" style="fill:var(--surface);stroke:var(--line-strong)"/>
          <circle cx="115" cy="115" r="86" style="fill:var(--accent-soft);stroke:var(--accent-line)"/>
          <circle cx="115" cy="115" r="56" style="fill:var(--surface);stroke:var(--line-strong)"/>
          ${ring(R1, 'outer', 0)}${ring(R2, 'inner', -k * step)}
          <text x="115" y="108" style="font-size:11px;fill:var(--muted)">kaydırma</text>
          <text x="115" y="128" style="font-size:22px;font-weight:600;fill:var(--accent)">${k}</text>
        </svg>
        <div style="flex:1;min-width:260px;color:var(--ink2);font-size:14px;line-height:1.6">
          Dış halka <b>düz metin</b>, iç halka <b style="color:var(--accent)">şifreli</b> alfabedir. İç halka <b>${k}</b> adım döndürülmüştür.
          ${dec ? 'Çözmede şifreli harften <b>k</b> adım geri gidilir.' : 'Örneğin <b>A → ' + A[k] + '</b>, <b>Z → ' + A[(25 + k) % 26] + '</b>.'}
          <br><span style="color:var(--muted);font-size:12.5px">Metninizde geçen harfler aşağıda vurgulanır.</span>
        </div>
      </div>
      <div class="alpha-map">${map}</div>${brute}`;
  }

  function vizMono(text, key, dec) {
    const used = new Set(C.onlyLetters(trNorm(text)));
    const map = A.split('').map((ch, i) => {
      const from = dec ? key[i] : ch;
      const to = dec ? ch : key[i];
      return `<div class="cell ${used.has(from) ? 'hit' : ''}"><span class="p">${from}</span><span class="arrow">▼</span><span class="c">${to}</span></div>`;
    }).join('');
    return `<p style="color:var(--ink2);margin-top:0">Her harf, anahtar alfabedeki karşılığıyla değiştirilir. Vurgulu sütunlar metninizde kullanılan harflerdir.</p><div class="alpha-map">${map}</div>`;
  }

  function vizPlayfair(r, dec) {
    if (!r.steps.length) return '<div class="viz-empty">Matris hazır — ikilileri görmek için metin yazın.</div>';
    const sel = Math.min(state.sel, r.steps.length - 1);
    const st = r.steps[sel];
    const a = st.in[0], b = st.out;
    const keyLetters = new Set();
    // anahtar harfleri: matriste alfabetik sıraya girmeden önceki harfler
    const flat = r.matrix.flat();
    let prev = '';
    for (const ch of flat) { if (prev && ch < prev) break; prev = ch; }
    const kw = C.onlyLetters(state.keys.playfair.key).replace(/J/g, 'I');
    for (const ch of kw) keyLetters.add(ch);
    const grid = flat.map((ch) => {
      let cls = keyLetters.has(ch) ? 'key' : '';
      if (st.in.includes(ch)) cls = 'a';
      if (st.out.includes(ch)) cls = 'b';
      return `<div class="${cls}">${ch === 'I' ? 'I/J' : ch}</div>`;
    }).join('');
    const ruleText = {
      row: 'Harfler <b>aynı satırda</b> → her biri ' + (dec ? 'solundaki' : 'sağındaki') + ' harfle değiştirilir (dairesel).',
      col: 'Harfler <b>aynı sütunda</b> → her biri ' + (dec ? 'üstündeki' : 'altındaki') + ' harfle değiştirilir (dairesel).',
      rect: 'Harfler <b>farklı satır ve sütunda</b> → dikdörtgenin köşeleri: her harf kendi satırında, diğer harfin sütunundaki harfle değiştirilir.',
    }[st.rule];
    const ruleShort = { row: 'satır', col: 'sütun', rect: 'dikdörtgen' };
    void a; void b;
    return `<div class="pf-wrap">
      <div><div class="pf-grid">${grid}</div><div class="mat-label" style="margin-top:8px">5 × 5 anahtar matrisi</div></div>
      <div style="flex:1;min-width:260px">
        <div class="pairs">${r.steps.slice(0, 60).map((s, i) => `<span class="pair ${i === sel ? 'sel' : ''}" data-sel="${i}">${s.in} → <span class="to">${s.out}</span><span class="r">${ruleShort[s.rule]}</span></span>`).join('')}${r.steps.length > 60 ? '<span class="pair">…</span>' : ''}</div>
        <div class="rule-box"><b style="color:var(--ink)">${st.in}</b> → <b style="color:var(--accent)">${st.out}</b> · ${ruleText}<br><span style="color:var(--muted);font-size:12.5px">Bir ikiliye tıklayarak matriste görün. ${dec ? '' : 'Tekrar eden harflerin arasına ve tek kalan son harfe dolgu harfi eklenir.'}</span></div>
      </div></div>`;
  }

  function matHTML(M, cls) {
    const n = M[0].length;
    return `<div class="mat ${cls}" style="grid-template-columns:repeat(${n},auto)">${M.map((r) => r.map((v) => `<span>${v}</span>`).join('')).join('')}</div>`;
  }
  function vizHill(r, K, dec) {
    const inv = r.inverse;
    const head = `<div class="mat-row" style="margin-bottom:14px">
        <div>${matHTML(K, 'k')}<div class="mat-label">K</div></div>
        <span class="op">→</span>
        <div>${inv ? matHTML(inv, 'k') : '<span style="color:var(--bad)">yok</span>'}<div class="mat-label">K⁻¹ mod 26</div></div>
        <span style="color:var(--muted);font-size:13px">det(K) mod 26 = <b style="color:var(--accent)">${r.det}</b></span>
      </div>`;
    if (!r.blocks.length) return head + '<div class="viz-empty">Blokları görmek için metin yazın.</div>';
    const sel = Math.min(state.sel, r.blocks.length - 1);
    const b = r.blocks[sel];
    const col = (v) => v.map((x) => [x]);
    const body = `<div class="mat-row">
        <div>${matHTML(r.used, 'k')}<div class="mat-label">${dec ? 'K⁻¹' : 'K'}</div></div><span class="op">×</span>
        <div>${matHTML(col(b.vin), 'p')}<div class="mat-label">${b.in}</div></div><span class="op">mod 26 =</span>
        <div>${matHTML(col(b.vout), 'c')}<div class="mat-label" style="color:var(--accent)">${b.out}</div></div>
      </div>
      <div class="blocks">${r.blocks.slice(0, 60).map((x, i) => `<span class="blk ${i === sel ? 'sel' : ''}" data-sel="${i}">${x.in} → <b>${x.out}</b></span>`).join('')}</div>`;
    return head + body;
  }

  function vizVigenere(align) {
    if (!align.length) return '<div class="viz-empty">Hizalamayı görmek için metin yazın.</div>';
    const a = align.slice(0, 40);
    const row = (cls, lab, f) => `<div class="vig-row ${cls}"><span class="lab">${lab}</span>${a.map((x) => `<span class="ch">${f(x)}</span>`).join('')}</div>`;
    return `<div class="vig-table">
      ${row('', 'Girdi', (x) => x.p)}
      ${row('k', 'Anahtar', (x) => x.k)}
      ${row('s', 'Kaydırma', (x) => '+' + (x.k.charCodeAt(0) - 65))}
      ${row('c', 'Çıktı', (x) => x.c)}
    </div>${align.length > 40 ? '<div class="viz-empty" style="margin-top:6px">… ilk 40 harf gösteriliyor</div>' : ''}
    <p style="color:var(--muted);font-size:13px;margin-bottom:0">Aynı düz metin harfinin farklı yerlerde farklı şifreli harflere dönüştüğüne dikkat edin — polialfabetik şifrenin gücü budur.</p>`;
  }

  function vizTransposition(r, dec, rounds) {
    if (!r.grid || !r.grid.length) return '<div class="viz-empty">Matrisi görmek için metin yazın.</div>';
    const n = r.order.length;
    const sel = Math.min(state.sel, n - 1);
    const hiCol = r.readSeq[sel];
    const rows = r.grid.slice(0, 14);
    const head = r.order.map((o, c) => `<div class="h">${o}<small>s${c + 1}</small></div>`).join('');
    const cells = rows.map((row) => row.map((ch, c) => `<div class="${c === hiCol ? 'col-hi' : ''}">${ch}</div>`).join('')).join('');
    const reads = r.readSeq.map((c, i) => `<span class="blk ${i === sel ? 'sel' : ''}" data-sel="${i}"><b>${i + 1}.</b>sütun ${c + 1}: ${r.grid.map((row) => row[c]).join('')}</span>`).join('');
    return `<p style="color:var(--ink2);margin-top:0">${dec ? 'Şifreli metin sütunlara anahtar sırasıyla yazıldı, satır satır okunarak düz metin elde edilir.' : 'Düz metin satır satır yazıldı; sütunlar başlıktaki numara sırasıyla okunur.'}${+rounds > 1 ? ` <b style="color:var(--accent)">(${rounds} turun son turu gösteriliyor)</b>` : ''}</p>
      <div class="tp-grid" style="grid-template-columns:repeat(${n},40px)">${head}${cells}</div>
      ${r.grid.length > 14 ? '<div class="viz-empty">… ilk 14 satır</div>' : ''}
      <div class="blocks">${reads}</div>`;
  }

  function vizXor(r, dec) {
    const sp = (h) => h.match(/.{1,2}/g).join(' ');
    const blocks = r.blocks.slice(0, 4).map((b, i) => `<div class="xor-block"><h4>Blok ${i + 1}</h4>
      <div class="hexrow"><span class="l">${dec ? 'Şifreli' : 'Düz'} (P${i + 1})</span><span class="v">${sp(b.in)}</span></div>
      <div class="hexrow"><span class="l">⊕ Anahtar</span><span class="v" style="color:var(--key)">${sp(r.key)}</span></div>
      <div class="hexrow"><span class="l">⊕ ${i === 0 ? 'IV' : 'Önceki C' + i}</span><span class="v" style="color:var(--accent)">${sp(b.prev)}</span></div>
      <div class="hexrow res"><span class="l">= ${dec ? 'Düz' : 'Şifreli'}</span><span class="v">${sp(b.out)}</span></div></div>`).join('');
    return `<p style="color:var(--ink2);margin-top:0">Anahtar ve IV, 16 baytlık bloklara katlanarak (XOR ile) üretilir. Son bloğa PKCS#7 dolgusu eklenir.</p>${blocks}${r.blocks.length > 4 ? `<div class="viz-empty">… toplam ${r.blocks.length} blok</div>` : ''}`;
  }

  function vizBase64(plain) {
    const bytes = Array.from(new TextEncoder().encode(plain)).slice(0, 18);
    if (!bytes.length) return '<div class="viz-empty">Bit gruplarını görmek için metin yazın.</div>';
    const T = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let html = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const g = bytes.slice(i, i + 3);
      const bits = g.map((b) => b.toString(2).padStart(8, '0')).join('');
      const padded = bits.padEnd(Math.ceil(bits.length / 6) * 6, '0');
      const sext = padded.match(/.{6}/g);
      const chars = sext.map((s) => `<span><b>${T[parseInt(s, 2)]}</b>${s}</span>`);
      while (chars.length < 4) chars.push('<span><b>=</b>dolgu</span>');
      html += `<div class="b64-group"><div class="bytes">${g.map((b) => b.toString(2).padStart(8, '0')).join(' ')}</div><div class="sext">${chars.join('')}</div></div>`;
    }
    return `<p style="color:var(--ink2);margin-top:0">Her 3 bayt (24 bit), 6 bitlik 4 gruba bölünür; her grup tablodan bir karaktere dönüşür.</p><div class="b64-bits">${html}</div>`;
  }

  /* ---------------- Frekans grafiği ---------------- */
  function freqOf(s) {
    const L = C.onlyLetters(trNorm(s));
    const f = new Array(26).fill(0);
    for (const ch of L) f[ch.charCodeAt(0) - 65]++;
    return L.length ? f.map((x) => x / L.length) : f;
  }
  function renderFreq(inp, out, tech) {
    const el = $('#freqChart');
    if (!tech.freq) {
      el.style.display = 'block';
      el.style.height = 'auto';
      el.innerHTML = `<p class="freq-note">${tech.freqNote}</p>`;
      return;
    }
    el.style.display = '';
    el.style.height = '';
    const fi = freqOf(inp), fo = freqOf(out);
    const max = Math.max(0.0001, ...fi, ...fo);
    if (!el.querySelector('.col')) {
      el.innerHTML = A.split('').map((ch) => `<div class="col"><div class="bars"><div class="bar in"></div><div class="bar out"></div></div><span class="lab">${ch}</span></div>`).join('');
    }
    el.querySelectorAll('.col').forEach((c, i) => {
      c.querySelector('.in').style.height = (fi[i] / max) * 100 + '%';
      c.querySelector('.out').style.height = (fo[i] / max) * 100 + '%';
      c.title = `${A[i]} · girdi %${(fi[i] * 100).toFixed(1)} · çıktı %${(fo[i] * 100).toFixed(1)}`;
    });
  }

  /* ---------------- Çıktı animasyonu ---------------- */
  let scrambleTimer = null;
  function setOutput(text) {
    const el = $('#output');
    clearInterval(scrambleTimer);
    if (!text || text.length > 700) { el.textContent = text; return; }
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@*';
    let frame = 0;
    const total = 10;
    scrambleTimer = setInterval(() => {
      frame++;
      const reveal = Math.floor((frame / total) * text.length);
      let s = text.slice(0, reveal);
      for (let i = reveal; i < text.length; i++) s += /\s/.test(text[i]) ? text[i] : pool[(Math.random() * pool.length) | 0];
      el.textContent = s;
      if (frame >= total) { clearInterval(scrambleTimer); el.textContent = text; }
    }, 28);
  }

  /* ---------------- Ana akış ---------------- */
  function renderSidebar() {
    let html = '', g = '';
    TECHS.forEach((t, i) => {
      if (t.group !== g) { g = t.group; html += `<div class="group">${g}</div>`; }
      html += `<button class="tech ${t.id === state.tech ? 'active' : ''}" data-tech="${t.id}"><span class="ico">${t.icon}</span><span><b>${t.name}</b><small>${String(i + 1).padStart(2, '0')} · ${t.short}</small></span></button>`;
    });
    $('#techList').innerHTML = html;
  }

  function renderTech() {
    const t = byId[state.tech];
    const i = TECHS.indexOf(t);
    $('#techTag').textContent = t.tag;
    $('#techNum').textContent = String(i + 1).padStart(2, '0');
    $('#techName').textContent = t.name;
    $('#techDesc').innerHTML = t.desc;
    $('#techFormula').innerHTML = t.formula.map((f) => `<code>${f}</code>`).join('');
    $('#techSec').innerHTML = t.security.map((s) => `<li>${s}</li>`).join('');
    $('#keyspace').innerHTML = 'Anahtar uzayı: ' + t.keyspace;
    const hero = $('#hero');
    hero.classList.remove('anim-in'); void hero.offsetWidth; hero.classList.add('anim-in');
    $('#freqChart').innerHTML = '';
    renderKeys();
  }

  function renderKeys() {
    const t = byId[state.tech];
    $('#keyArea').innerHTML = t.keysHTML(state.keys[t.id]);
  }

  function update(animate = true) {
    const t = byId[state.tech];
    const dec = state.mode === 'dec';
    const text = $('#input').value;
    $('#inLabel').textContent = dec ? 'Şifreli metin (Ciphertext)' : 'Düz metin (Plaintext)';
    $('#outLabel').textContent = dec ? 'Çözülmüş metin (Plaintext)' : 'Şifreli metin (Ciphertext)';
    $('#inCount').textContent = text.length + ' karakter';
    const err = $('#error');
    try {
      const r = t.run(text, dec, state.keys[t.id]);
      err.hidden = true;
      if (animate) setOutput(r.result); else $('#output').textContent = r.result;
      $('#outCount').textContent = r.result.length + ' karakter';
      $('#viz').innerHTML = r.viz;
      renderFreq(text, r.result, t);
    } catch (e) {
      err.hidden = false;
      err.textContent = e.message;
      $('#output').textContent = '';
      $('#outCount').textContent = '0 karakter';
      $('#viz').innerHTML = '<div class="viz-empty">Geçerli bir anahtar ve girdi bekleniyor.</div>';
      renderFreq(text, '', t);
    }
  }

  function setMode(m) {
    state.mode = m;
    document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
    $('.mode').classList.toggle('dec', m === 'dec');
    state.sel = 0;
    update();
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), 1600);
  }

  /* ---------------- Olaylar ---------------- */
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

  $('#input').addEventListener('input', () => { state.sel = 0; update(); });

  const keyArea = $('#keyArea');
  keyArea.addEventListener('input', (e) => {
    const t = byId[state.tech];
    const k = state.keys[t.id];
    const el = e.target;
    if (el.dataset.cell) {
      const [i, j] = el.dataset.cell.split(',').map(Number);
      k.M[i][j] = C.mod(parseInt(el.value, 10) || 0, 26);
      // sadece durum etiketini güncelle (odak kaybolmasın)
      const d = C.mod(C.det(k.M), 26), ok = C.gcd(d, 26) === 1;
      const st = keyArea.querySelector('.key-status');
      st.className = 'key-status ' + (ok ? 'ok' : 'bad');
      st.textContent = `det(K) mod 26 = ${d} → ${ok ? '✓ tersi var' : '✗ tersi yok (gcd ≠ 1)'}`;
      update(false);
      return;
    }
    const name = el.dataset.key;
    if (!name) return;
    let val = el.type === 'range' ? +el.value : el.value;
    if (t.onKey) t.onKey(name, val, k);
    if (!(t.onKey && (name === 'word' || name === 'key') && t.id === 'mono')) k[name] = (name === 'rounds' || name === 'n') ? +val : val;
    if (t.id === 'mono') {
      if (name === 'word') k.word = val;
      const pos = el.selectionStart;
      renderKeys();
      const again = keyArea.querySelector(`[data-key="${name}"]`);
      if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (_) {} }
    }
    if (t.id === 'hill' && name === 'n') renderKeys();
    if (t.id === 'caesar') $('#shiftVal').textContent = val;
    update(t.id !== 'caesar');
  });
  keyArea.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const t = byId[state.tech];
    t.action(b.dataset.action, state.keys[t.id]);
    renderKeys();
    update();
  });

  $('#viz').addEventListener('click', (e) => {
    const s = e.target.closest('[data-sel]');
    if (!s) return;
    state.sel = +s.dataset.sel;
    update(false);
  });

  $('#swapBtn').addEventListener('click', () => {
    const out = $('#output').textContent;
    if (!out) return;
    clearInterval(scrambleTimer);
    const t = byId[state.tech];
    $('#input').value = t.run($('#input').value, state.mode === 'dec', state.keys[t.id]).result;
    setMode(state.mode === 'enc' ? 'dec' : 'enc');
    toast(state.mode === 'dec' ? 'Şimdi şifreli metni çözüyorsunuz' : 'Şimdi düz metni şifreliyorsunuz');
  });

  $('#copyBtn').addEventListener('click', async () => {
    const t = byId[state.tech];
    let txt;
    try { txt = t.run($('#input').value, state.mode === 'dec', state.keys[t.id]).result; } catch (_) { txt = ''; }
    if (!txt) return;
    try { await navigator.clipboard.writeText(txt); }
    catch (_) {
      const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (__) {} ta.remove();
    }
    toast('Panoya kopyalandı');
  });

  $('#clearBtn').addEventListener('click', () => { $('#input').value = ''; update(); $('#input').focus(); });

  function loadExample(withToast = true) {
    const t = byId[state.tech];
    state.keys[t.id] = Object.assign(JSON.parse(JSON.stringify(t.defaults)), JSON.parse(JSON.stringify(t.example.keys)));
    $('#input').value = t.example.text;
    state.mode = 'enc';
    document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === 'enc'));
    $('.mode').classList.remove('dec');
    state.sel = 0;
    renderKeys();
    update();
    if (withToast) toast('Ders örneği yüklendi');
  }
  $('#exampleBtn').addEventListener('click', () => loadExample());

  /* ---------------- Başlat ---------------- */
  renderSidebar();
  renderTech();
  loadExample(false);
})();

/**
 * =============================================================
 *  KriptoLab — visualizations.js
 *  Builds the HTML for the "How it works" panel of each cipher.
 *
 *  Every function receives the data returned by the cipher module
 *  and returns an HTML string. `sel` is the index of the block / pair
 *  the user clicked (the UI re-renders when it changes).
 * =============================================================
 */
(function (global) {
  'use strict';

  const C = global.Ciphers;
  const A = C.ALPHABET;
  const t = (tr, en) => global.I18N.t(tr, en);

  /** Escapes text before inserting it into HTML. */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const empty = (tr, en) => `<div class="viz-empty">${t(tr, en)}</div>`;

  /** Alphabet mapping row: plaintext letter ▼ ciphertext letter. Used letters are highlighted. */
  function alphabetMap(mapping, used) {
    return `<div class="alpha-map">${mapping.map(([from, to]) =>
      `<div class="cell ${used.has(from) ? 'hit' : ''}"><span class="p">${from}</span><span class="arrow">▼</span><span class="c">${to}</span></div>`).join('')}</div>`;
  }

  /* ---------------- Caesar ---------------- */
  function caesar({ letters, k, dec }) {
    const used = new Set(letters);
    const step = 360 / 26, c = 115;

    // One ring of letters drawn around the centre; the inner ring is rotated by k steps.
    const ring = (r, cls, rot) => `<g class="${cls}" style="transform:rotate(${rot}deg)">${A.split('').map((ch, i) => {
      const a = ((i * step - 90) * Math.PI) / 180;
      const x = c + r * Math.cos(a), y = c + r * Math.sin(a);
      return `<text x="${x}" y="${y}" transform="rotate(${i * step} ${x} ${y})">${ch}</text>`;
    }).join('')}</g>`;

    const mapping = A.split('').map((ch, i) => (dec ? [A[(i + k) % 26], ch] : [ch, A[(i + k) % 26]]));

    let brute = '';
    if (letters) {
      const cipherSample = dec ? letters.slice(0, 26) : C.caesar(letters.slice(0, 26), k);
      brute = `<div class="sub-title">${t('Kaba kuvvet saldırısı · şifreli metne 25 anahtarın hepsi denenir', 'Brute-force attack · all 25 keys tried on the ciphertext')}</div>
        <div class="brute">${C.caesarBruteForce(cipherSample).map((r) =>
          `<div class="${r.k === k ? 'me' : ''}"><b>k=${String(r.k).padStart(2, '0')}</b>${esc(r.text.toLowerCase())}</div>`).join('')}</div>`;
    }

    return `<div class="wheel-wrap">
        <svg class="wheel" viewBox="0 0 230 230" role="img" aria-label="Caesar wheel">
          <circle cx="115" cy="115" r="112" style="fill:var(--surface);stroke:var(--line-strong)"/>
          <circle cx="115" cy="115" r="86" style="fill:var(--accent-soft);stroke:var(--accent-line)"/>
          <circle cx="115" cy="115" r="56" style="fill:var(--surface);stroke:var(--line-strong)"/>
          ${ring(100, 'outer', 0)}${ring(72, 'inner', -k * step)}
          <text x="115" y="106" style="font-size:11px;fill:var(--muted)">${t('kaydırma', 'shift')}</text>
          <text x="115" y="128" style="font-size:22px;font-weight:600;fill:var(--accent)">${k}</text>
        </svg>
        <div class="viz-text">
          ${t(`Dış halka <b>düz metin</b>, iç halka <b class="acc">şifreli</b> alfabedir. İç halka <b>${k}</b> adım döndürülmüştür.`,
              `The outer ring is the <b>plain</b> alphabet, the inner ring the <b class="acc">cipher</b> alphabet, rotated by <b>${k}</b> positions.`)}
          ${dec ? t('Çözmede şifreli harften <b>k</b> adım geri gidilir.', 'Decryption moves <b>k</b> positions back.')
                : t('Örneğin', 'For example') + ` <b>A → ${A[k]}</b>, <b>Z → ${A[(25 + k) % 26]}</b>.`}
          <div class="viz-note">${t('Metninizde geçen harfler aşağıda vurgulanır.', 'Letters that occur in your text are highlighted below.')}</div>
        </div>
      </div>
      ${alphabetMap(mapping, used)}${brute}`;
  }

  /* ---------------- Monoalphabetic ---------------- */
  function mono({ letters, key, dec }) {
    const mapping = A.split('').map((ch, i) => (dec ? [key[i], ch] : [ch, key[i]]));
    return `<p class="viz-text">${t('Her harf, anahtar alfabedeki karşılığıyla değiştirilir. Vurgulu sütunlar metninizde geçen harflerdir.',
      'Each letter is replaced by its partner in the key alphabet. Highlighted columns are letters that occur in your text.')}</p>
      ${alphabetMap(mapping, new Set(letters))}`;
  }

  /* ---------------- Playfair ---------------- */
  function playfair({ r, dec, keyword, sel }) {
    if (!r.steps.length) return empty('Matris hazır — ikilileri görmek için metin yazın.', 'The matrix is ready — type some text to see the pairs.');
    sel = Math.min(sel, r.steps.length - 1);
    const st = r.steps[sel];
    const keyLetters = new Set(C.onlyLetters(keyword).replace(/J/g, 'I'));

    const grid = r.matrix.flat().map((ch) => {
      let cls = keyLetters.has(ch) ? 'key' : '';
      if (st.in.includes(ch)) cls = 'a';
      if (st.out.includes(ch)) cls = 'b';
      return `<div class="${cls}">${ch === 'I' ? 'I/J' : ch}</div>`;
    }).join('');

    const ruleName = { row: t('satır', 'row'), col: t('sütun', 'column'), rect: t('dikdörtgen', 'rectangle') };
    const ruleText = {
      row: t(`Harfler <b>aynı satırda</b>: her biri ${dec ? 'solundaki' : 'sağındaki'} harfle değiştirilir (dairesel).`,
             `Letters are in the <b>same row</b>: each is replaced by the letter to its ${dec ? 'left' : 'right'} (wrapping around).`),
      col: t(`Harfler <b>aynı sütunda</b>: her biri ${dec ? 'üstündeki' : 'altındaki'} harfle değiştirilir (dairesel).`,
             `Letters are in the <b>same column</b>: each is replaced by the letter ${dec ? 'above' : 'below'} it (wrapping around).`),
      rect: t('Harfler <b>farklı satır ve sütunda</b>: dikdörtgenin köşeleri alınır; her harf kendi satırında, diğer harfin sütunundaki harfle değiştirilir.',
              'Letters form a <b>rectangle</b>: each is replaced by the letter in its own row and the other letter\'s column.'),
    }[st.rule];

    return `<div class="pf-wrap">
      <div><div class="pf-grid">${grid}</div><div class="mat-label" style="margin-top:8px">${t('5 × 5 anahtar matrisi', '5 × 5 key matrix')}</div></div>
      <div style="flex:1;min-width:260px">
        <div class="pairs">${r.steps.slice(0, 60).map((s, i) =>
          `<span class="pair ${i === sel ? 'sel' : ''}" data-sel="${i}">${s.in} → <span class="to">${s.out}</span><span class="r">${ruleName[s.rule]}</span></span>`).join('')}${r.steps.length > 60 ? '<span class="pair">…</span>' : ''}</div>
        <div class="rule-box"><b>${st.in}</b> → <b class="acc">${st.out}</b> · ${ruleText}
          <div class="viz-note">${t('Bir ikiliye tıklayarak matriste görün.', 'Click a pair to highlight it in the matrix.')}
          ${dec ? '' : t(' Tekrar eden harflerin arasına ve tek kalan son harfe dolgu harfi eklenir.', ' A filler letter is inserted between repeated letters and after a single last letter.')}</div></div>
      </div></div>`;
  }

  /* ---------------- Hill ---------------- */
  const matHTML = (M, cls) =>
    `<div class="mat ${cls}" style="grid-template-columns:repeat(${M[0].length},auto)">${M.map((r) => r.map((v) => `<span>${v}</span>`).join('')).join('')}</div>`;

  function hill({ r, K, dec, sel }) {
    const head = `<div class="mat-row" style="margin-bottom:16px">
        <div>${matHTML(K, 'k')}<div class="mat-label">K</div></div>
        <span class="op">→</span>
        <div>${r.inverse ? matHTML(r.inverse, 'k') : '—'}<div class="mat-label">K⁻¹ mod 26</div></div>
        <span class="viz-note">det(K) mod 26 = <b class="acc">${r.det}</b></span>
      </div>`;
    if (!r.blocks.length) return head + empty('Blokları görmek için metin yazın.', 'Type some text to see the blocks.');
    sel = Math.min(sel, r.blocks.length - 1);
    const b = r.blocks[sel];
    const col = (v) => v.map((x) => [x]);
    return head + `<div class="mat-row">
        <div>${matHTML(r.used, 'k')}<div class="mat-label">${dec ? 'K⁻¹' : 'K'}</div></div><span class="op">×</span>
        <div>${matHTML(col(b.vin), 'p')}<div class="mat-label">${b.in}</div></div><span class="op">mod 26 =</span>
        <div>${matHTML(col(b.vout), 'c')}<div class="mat-label acc">${b.out}</div></div>
      </div>
      <div class="blocks">${r.blocks.slice(0, 60).map((x, i) =>
        `<span class="blk ${i === sel ? 'sel' : ''}" data-sel="${i}">${x.in} → <b>${x.out}</b></span>`).join('')}</div>
      <div class="viz-note" style="margin-top:8px">${t('a = 0, b = 1, …, z = 25. Bir bloğa tıklayarak çarpımını görün.', 'a = 0, b = 1, …, z = 25. Click a block to see its multiplication.')}</div>`;
  }

  /* ---------------- Vigenère ---------------- */
  function vigenere({ align }) {
    if (!align.length) return empty('Hizalamayı görmek için metin yazın.', 'Type some text to see the alignment.');
    const a = align.slice(0, 40);
    const row = (cls, label, f) => `<div class="vig-row ${cls}"><span class="lab">${label}</span>${a.map((x) => `<span class="ch">${f(x)}</span>`).join('')}</div>`;
    return `<div class="vig-table">
      ${row('', t('Girdi', 'Input'), (x) => x.p)}
      ${row('k', t('Anahtar', 'Key'), (x) => x.k)}
      ${row('s', t('Kaydırma', 'Shift'), (x) => '+' + (x.k.charCodeAt(0) - 65))}
      ${row('c', t('Çıktı', 'Output'), (x) => x.c)}
    </div>${align.length > 40 ? empty('… ilk 40 harf gösteriliyor', '… first 40 letters shown') : ''}
    <p class="viz-note">${t('Aynı düz metin harfi farklı yerlerde farklı şifreli harflere dönüşür; polialfabetik şifrenin gücü budur.',
      'The same plaintext letter becomes different ciphertext letters at different positions; this is the strength of a polyalphabetic cipher.')}</p>`;
  }

  /* ---------------- Transposition ---------------- */
  function transposition({ r, dec, rounds, sel }) {
    if (!r.grid || !r.grid.length) return empty('Matrisi görmek için metin yazın.', 'Type some text to see the matrix.');
    const n = r.order.length;
    sel = Math.min(sel, n - 1);
    const hiCol = r.readSeq[sel];
    const head = r.order.map((o, c) => `<div class="h">${o}<small>${t('s', 'c')}${c + 1}</small></div>`).join('');
    const cells = r.grid.slice(0, 14).map((row) => row.map((ch, c) => `<div class="${c === hiCol ? 'col-hi' : ''}">${ch}</div>`).join('')).join('');
    const reads = r.readSeq.map((c, i) =>
      `<span class="blk ${i === sel ? 'sel' : ''}" data-sel="${i}"><b>${i + 1}.</b> ${t('sütun', 'column')} ${c + 1}: ${r.grid.map((row) => row[c]).join('')}</span>`).join('');
    return `<p class="viz-text">${dec
        ? t('Şifreli metin sütunlara anahtar sırasıyla yazılır, sonra satır satır okunur.', 'The ciphertext is written into the columns in key order, then read row by row.')
        : t('Düz metin satır satır yazılır; sütunlar başlıktaki numara sırasıyla okunur.', 'The plaintext is written row by row; the columns are read in the order of the numbers in the header.')}
      ${+rounds > 1 ? `<b class="acc">(${t(`${rounds} turun son turu gösteriliyor`, `showing the last of ${rounds} rounds`)})</b>` : ''}</p>
      <div class="tp-grid" style="grid-template-columns:repeat(${n},38px)">${head}${cells}</div>
      ${r.grid.length > 14 ? empty('… ilk 14 satır', '… first 14 rows') : ''}
      <div class="blocks">${reads}</div>`;
  }

  /* ---------------- XOR ---------------- */
  const spaced = (h) => (h.match(/.{1,2}/g) || []).join(' ');
  const hex2 = (b) => b.toString(16).padStart(2, '0').toUpperCase();
  const printable = (b) => (b >= 32 && b < 127 ? esc(String.fromCharCode(b)) : '·');

  function xorSimple({ r, dec }) {
    if (!r.bytes.length) return empty('Baytları görmek için metin yazın.', 'Type some text to see the bytes.');
    const col = (label, f, cls) => `<div class="vig-row ${cls}"><span class="lab">${label}</span>${r.bytes.map((x) => `<span class="ch hex">${f(x)}</span>`).join('')}</div>`;
    return `<p class="viz-text">${t('Her bayt, anahtarın sıradaki baytıyla XOR’lanır; anahtar bittiğinde başa dönülür. Aynı işlem iki kez uygulanınca düz metin geri gelir: (P ⊕ K) ⊕ K = P.',
      'Every byte is XORed with the next key byte; the key repeats when it runs out. Applying the same operation twice restores the plaintext: (P ⊕ K) ⊕ K = P.')}</p>
      <div class="vig-table">
        ${col(dec ? t('Şifreli', 'Cipher') : t('Karakter', 'Char'), (x) => printable(x.p), '')}
        ${col(t('Bayt (hex)', 'Byte (hex)'), (x) => hex2(x.p), 's')}
        ${col('⊕ ' + t('Anahtar', 'Key'), (x) => hex2(x.k), 'k')}
        ${col('= ' + t('Sonuç', 'Result'), (x) => hex2(x.c), 'c')}
      </div>
      <p class="viz-note">${t('Zayıflık: aynı düz metin parçası her zaman aynı şifreli çıktıyı verir. Zincirleme XOR modunu deneyin.', 'Weakness: identical plaintext always produces identical ciphertext. Try the chained XOR mode.')}</p>`;
  }

  function xorChained({ r, dec }) {
    const blocks = r.blocks.slice(0, 4).map((b, i) => `<div class="xor-block"><h4>${t('Blok', 'Block')} ${i + 1}</h4>
      <div class="hexrow"><span class="l">${dec ? 'C' : 'P'}${i + 1}</span><span class="v">${spaced(b.in)}</span></div>
      <div class="hexrow"><span class="l">⊕ K</span><span class="v keyc">${spaced(r.key)}</span></div>
      <div class="hexrow"><span class="l">⊕ ${i === 0 ? 'IV' : 'C' + i}</span><span class="v">${spaced(b.prev)}</span></div>
      <div class="hexrow res"><span class="l">= ${dec ? 'P' : 'C'}${i + 1}</span><span class="v">${spaced(b.out)}</span></div></div>`).join('');
    return `<p class="viz-text">${t('Anahtar ve IV, 16 baytlık bloklara katlanır. Her blok anahtarla <b>ve bir önceki şifreli blokla</b> XOR’lanır; son bloğa PKCS#7 dolgusu eklenir.',
      'The key and IV are folded into 16-byte blocks. Each block is XORed with the key <b>and the previous ciphertext block</b>; the last block receives PKCS#7 padding.')}</p>
      ${blocks}${r.blocks.length > 4 ? empty(`… toplam ${r.blocks.length} blok`, `… ${r.blocks.length} blocks in total`) : ''}`;
  }

  /* ---------------- Base64 ---------------- */
  function base64({ plain }) {
    const bytes = Array.from(C.utf8Encoder.encode(plain)).slice(0, 18);
    if (!bytes.length) return empty('Bit gruplarını görmek için metin yazın.', 'Type some text to see the bit groups.');
    const T = C.BASE64_TABLE;
    let html = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const g = bytes.slice(i, i + 3);
      const bits = g.map((b) => b.toString(2).padStart(8, '0')).join('');
      const sextets = bits.padEnd(Math.ceil(bits.length / 6) * 6, '0').match(/.{6}/g);
      const chars = sextets.map((s) => `<span><b>${T[parseInt(s, 2)]}</b>${s}</span>`);
      while (chars.length < 4) chars.push(`<span><b>=</b>${t('dolgu', 'pad')}</span>`);
      html += `<div class="b64-group"><div class="bytes">${g.map((b) => b.toString(2).padStart(8, '0')).join(' ')}</div><div class="sext">${chars.join('')}</div></div>`;
    }
    return `<p class="viz-text">${t('Her 3 bayt (24 bit) 6 bitlik 4 gruba bölünür; her grup tablodan bir karaktere dönüşür.',
      'Every 3 bytes (24 bits) are split into four 6-bit groups; each group selects one character from the table.')}</p>
      <div class="b64-bits">${html}</div>`;
  }

  global.Viz = { caesar, mono, playfair, hill, vigenere, transposition, xorSimple, xorChained, base64, esc };
})(window);

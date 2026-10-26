/**
 * =============================================================
 *  KriptoLab — i18n.js
 *  Turkish / English interface strings.
 *
 *  Static text in index.html carries a data-i18n="key" attribute
 *  and is filled from UI[key]. Dynamic text (cipher descriptions,
 *  visualisations) uses I18N.t(turkish, english) or I18N.pick({tr,en}).
 * =============================================================
 */
(function (global) {
  'use strict';

  const UI = {
    appSub: { tr: 'Klasik Şifreleme Teknikleri', en: 'Classical Encryption Techniques' },
    encrypt: { tr: 'Şifrele', en: 'Encrypt' },
    decrypt: { tr: 'Çöz', en: 'Decrypt' },
    loadExample: { tr: 'Ders örneğini yükle', en: 'Load lecture example' },
    plaintext: { tr: 'Düz metin (Plaintext)', en: 'Plaintext' },
    ciphertext: { tr: 'Şifreli metin (Ciphertext)', en: 'Ciphertext' },
    decrypted: { tr: 'Çözülmüş metin (Plaintext)', en: 'Decrypted plaintext' },
    encoded: { tr: 'Kodlanmış metin (Base64)', en: 'Encoded text (Base64)' },
    chars: { tr: 'karakter', en: 'chars' },
    placeholder: { tr: 'Metninizi buraya yazın…', en: 'Type your message here…' },
    outputEmpty: { tr: 'Çıktı burada görünecek…', en: 'The result will appear here…' },
    clear: { tr: 'Temizle', en: 'Clear' },
    copy: { tr: 'Kopyala', en: 'Copy' },
    swapTitle: { tr: 'Çıktıyı girdiye taşı ve işlemi tersine çevir', en: 'Move the output to the input and reverse the operation' },
    howItWorks: { tr: 'Nasıl çalışıyor?', en: 'How it works' },
    stepByStep: { tr: 'Adım adım gösterim', en: 'Step-by-step view' },
    freqTitle: { tr: 'Harf frekansı', en: 'Letter frequency' },
    freqSub: { tr: 'Girdi ve çıktı · istatistiksel saldırı', en: 'Input vs. output · statistical attack' },
    input: { tr: 'Girdi', en: 'Input' },
    output: { tr: 'Çıktı', en: 'Output' },
    secTitle: { tr: 'Güvenlik notları', en: 'Security notes' },
    secSub: { tr: 'Ders notlarından', en: 'From the lecture notes' },
    keyspace: { tr: 'Anahtar uzayı', en: 'Key space' },
    footer: {
      tr: 'KriptoLab · Tüm işlemler yerel olarak yapılır; veri hiçbir yere gönderilmez.',
      en: 'KriptoLab · All processing happens locally; no data leaves your computer.',
    },
    toastExample: { tr: 'Ders örneği yüklendi', en: 'Lecture example loaded' },
    toastCopied: { tr: 'Panoya kopyalandı', en: 'Copied to clipboard' },
    toastNowDec: { tr: 'Şimdi şifreli metni çözüyorsunuz', en: 'Now decrypting the ciphertext' },
    toastNowEnc: { tr: 'Şimdi düz metni şifreliyorsunuz', en: 'Now encrypting the plaintext' },
    waiting: { tr: 'Geçerli bir anahtar ve girdi bekleniyor.', en: 'Waiting for a valid key and input.' },
    navLabel: { tr: 'Şifreleme teknikleri', en: 'Cipher techniques' },
  };

  const I18N = {
    lang: 'en',
    /** Returns the Turkish or English variant depending on the active language. */
    t(tr, en) { return this.lang === 'tr' ? tr : en; },
    /** Picks the active language from an object {tr, en}. */
    pick(obj) { return obj == null ? '' : typeof obj === 'string' ? obj : obj[this.lang]; },
    /** Looks up a static UI string. */
    ui(key) { return UI[key] ? UI[key][this.lang] : key; },
    /** Fills every element that has data-i18n / data-i18n-ph / data-i18n-title. */
    apply(root = document) {
      document.documentElement.lang = this.lang;
      root.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = this.ui(el.dataset.i18n)));
      root.querySelectorAll('[data-i18n-ph]').forEach((el) => (el.placeholder = this.ui(el.dataset.i18nPh)));
      root.querySelectorAll('[data-i18n-title]').forEach((el) => (el.title = this.ui(el.dataset.i18nTitle)));
      root.querySelectorAll('[data-i18n-empty]').forEach((el) => el.setAttribute('data-empty', this.ui(el.dataset.i18nEmpty)));
    },
  };

  global.I18N = I18N;
})(window);

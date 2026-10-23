# Classical Cipher Lab (KriptoLab)

Klasik şifreleme tekniklerini tarayıcıda deneyimleyen etkileşimli bir web uygulaması. Her teknik için metni **şifreleyebilir** ya da **çözebilir**, işlemin nasıl yapıldığını adım adım görselleştirmelerle inceleyebilirsiniz.

> *Lecture 2 – Classical Encryption Techniques* dersi kapsamında hazırlanmıştır.

## Teknikler

| # | Teknik | Tür | Görselleştirme |
|---|--------|-----|----------------|
| 1 | Caesar | Monoalfabetik yer değiştirme | Şifre çarkı, alfabe eşlemesi, 25 anahtarla kaba kuvvet saldırısı |
| 2 | Monoalfabetik | Rastgele permütasyon | Anahtar alfabe eşlemesi (anahtar kelimeden / rastgele üretim) |
| 3 | Playfair | Çok harfli (digram) | 5×5 matris, ikili bazında uygulanan kural |
| 4 | Hill | Lineer cebir (mod 26) | K ve K⁻¹ matrisleri, blok blok matris çarpımı (2×2 / 3×3) |
| 5 | Vigenère | Polialfabetik | Girdi – anahtar – kaydırma – çıktı hizalaması |
| 6 | Sütunlu Transpozisyon | Permütasyon | Matris ve sütun okuma sırası, çok turlu şifreleme |
| 7 | Diferansiyel XOR | Blok zincirleme | Her blok için P ⊕ K ⊕ Cᵢ₋₁ adımları (HEX) |
| 8 | Base64 | Kodlama | 3 bayt → 4 × 6 bit gruplaması |

Her teknikte ayrıca:
- Girdi ve çıktının **harf frekansı** grafiği (istatistiksel saldırı)
- Ders notlarından **güvenlik notları** ve **anahtar uzayı**
- **Ders örneğini yükle** butonu ile hazır örnekler
- Çıktıyı girdiye taşıyıp ters işlemi yapan **yer değiştir** butonu

## Kullanım

Kurulum gerektirmez. Depoyu indirip `index.html` dosyasını bir tarayıcıda açmanız yeterlidir.

```bash
git clone https://github.com/efilsaylam19/classical-cipher-lab.git
cd classical-cipher-lab
# index.html dosyasını tarayıcıda açın
```

## Doğrulama

Algoritmalar ders notlarındaki ve standart kaynaklardaki test vektörleriyle doğrulanmıştır:

- Caesar (k = 3): `are you ready` → `DUH BRX UHDGB`
- Vigenère (anahtar `abracadabra`): `canyoumeetmeatmidnight…` → `CBEYQUPEFKMEBK…`
- Playfair (anahtar `monarchy`): `instruments` → `GATLMZCLRQXA`
- Hill (3×3): `paymoremoney` → `RRLMWBKASPDH`

## Notlar

- Klasik şifreler 26 harfli İngilizce alfabeyle çalışır; Türkçe karakterler (ç, ğ, ı, ö, ş, ü) otomatik olarak karşılıklarına dönüştürülür. XOR ve Base64 UTF-8 metni olduğu gibi işler.
- Hill şifresinde `C = K · P mod 26` (sütun vektörü) gösterimi kullanılır; anahtar matrisin determinantı 26 ile aralarında asal olmalıdır.
- Tüm işlemler tarayıcıda yapılır; hiçbir veri bir sunucuya gönderilmez.

## Proje yapısı

```
├── index.html
├── css/style.css
└── js/
    ├── ciphers.js   # Şifreleme algoritmaları (saf fonksiyonlar)
    └── app.js       # Arayüz ve görselleştirmeler
```

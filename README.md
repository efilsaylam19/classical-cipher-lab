# KriptoLab — Classic Cipher Tool

An interactive tool that encrypts and decrypts messages with classical ciphers and visualises every step of the algorithms. Built for the *Lecture 2 – Classical Encryption Techniques* bonus assignment.

**Required ciphers:** Caesar · Hill · Base64 · XOR · Vigenère · Transposition · Playfair
**Extra:** Monoalphabetic substitution, letter-frequency analysis, Turkish / English interface

## Running

| Option | How |
|---|---|
| Windows executable | Double-click `KriptoLab.exe` (Windows 10/11, 64-bit, no installation). If SmartScreen warns about an unsigned app: *More info → Run anyway*. |
| From source | Open `index.html` in any modern browser. |
| Tests | `node tests/test-ciphers.js` |

## Features

| # | Cipher | Visualisation |
|---|--------|---------------|
| 1 | Caesar | Cipher wheel, alphabet mapping, brute-force attack with all 25 keys |
| 2 | Monoalphabetic (extra) | Key alphabet mapping; key from keyword or random |
| 3 | Playfair | 5×5 key matrix, rule applied to each pair |
| 4 | Hill (2×2 / 3×3) | K, K⁻¹ mod 26 and the matrix multiplication of each block |
| 5 | Vigenère | Plaintext / key / shift / ciphertext alignment |
| 6 | Transposition | Column matrix, reading order, 1–5 rounds |
| 7 | XOR (simple + differential) | Byte table, or block chain Cᵢ = Pᵢ ⊕ K ⊕ Cᵢ₋₁ |
| 8 | Base64 | 3 bytes → 4 × 6-bit groups |

Every cipher also shows the formulas, the key space, the security notes from the lecture and an input-vs-output frequency chart.

## Project structure

```
index.html                  entry page
css/style.css               layout and theme (light + automatic dark mode)
css/fonts.css, fonts/       IBM Plex fonts, bundled for offline use (SIL OFL)
js/core.js                  shared helpers: mod, gcd, modular inverse, UTF-8/hex, error messages
js/ciphers/caesar.js        one module per cipher — pure functions, no UI code
js/ciphers/monoalphabetic.js
js/ciphers/playfair.js
js/ciphers/hill.js
js/ciphers/vigenere.js
js/ciphers/transposition.js
js/ciphers/xor.js
js/ciphers/base64.js
js/ui/i18n.js               Turkish / English strings
js/ui/visualizations.js     "How it works" panels
js/app.js                   cipher registry, rendering and events
tests/test-ciphers.js       test vectors and round-trip tests
build/                      Neutralinojs configuration for the .exe
```

## Test vectors

| Cipher | Key | Plaintext | Ciphertext |
|---|---|---|---|
| Caesar | k = 3 | `are you ready` | `DUH BRX UHDGB` |
| Hill | 17 21 2 / 17 18 2 / 5 21 19 | `paymoremoney` | `RRLMWBKASPDH` |
| Vigenère | `abracadabra` | `canyoumeetmeatmidnight…` | `CBEYQUPEFKMEBK…` |
| Transposition | `4312567` | `attackpostponeduntiltwoam` | `TTNAAPTMTSUOAODWCOIXKNLXPETX` |
| Playfair | `monarchy` | `instruments` | `GATLMZCLRQXA` |

## Building the .exe

```bash
npm install -g @neutralinojs/neu
# copy index.html, css/, js/, fonts/, icon.png into build/resources/
cd build
neu update
neu build --embed-resources     # → dist/KriptoLab/KriptoLab-win_x64.exe
```

The app runs entirely offline; no data leaves the computer.

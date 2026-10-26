/**
 * Unit tests for the cipher modules (run with:  node tests/test-ciphers.js)
 * Uses textbook / lecture test vectors and random round-trip checks.
 */
const path=require('path'); const d=path.join(__dirname,'..','js')+'/';
['core','ciphers/caesar','ciphers/monoalphabetic','ciphers/playfair','ciphers/hill','ciphers/vigenere','ciphers/transposition','ciphers/xor','ciphers/base64'].forEach(f=>require(d+f+'.js'));
const C=globalThis.Ciphers; let fail=0;
const eq=(a,b,n)=>{if(a!==b){fail++;console.log('FAIL',n,a,b)}else console.log('OK  ',n)};
eq(C.caesar('are you ready',3).toUpperCase(),'DUH BRX UHDGB','caesar');
const mk=C.randomMonoKey(); eq(C.mono(C.mono('Attack at Dawn',mk),mk,true),'Attack at Dawn','mono');
eq(C.monoKeyFromKeyword('thijab'),'THIJABCDEFGKLMNOPQRSUVWXYZ','mono kw');
eq(C.vigenere('canyoumeetmeatmidnightihavethegoods','abracadabra').result.toUpperCase().slice(0,14),'CBEYQUPEFKMEBK','vig');
eq(C.playfair('instruments','monarchy').result,'GATLMZCLRQXA','playfair');
eq(C.playfair('GATLMZCLRQXA','monarchy',true).result,'INSTRUMENTSX','playfair dec');
eq(C.playfair('balloon','monarchy').result.length,8,'pf balloon');
const K=[[17,21,2],[17,18,2],[5,21,19]];
eq(C.hill('paymoremoney',K).result,'RRLMWBKASPDH','hill');
eq(C.hill('RRLMWBKASPDH',K,true).result,'PAYMOREMONEY','hill dec');
eq(C.hill(C.hill('helpme',[[3,3],[2,5]]).result,[[3,3],[2,5]],true).result,'HELPME','hill2');
for(let i=0;i<20;i++){const R=C.randomHillKey(3);const t='randommessagexx';eq(C.hill(C.hill(t,R).result,R,true).result,'RANDOMMESSAGEXX','hill rand '+i)}
eq(C.transposition('attackpostponeduntiltwoam','4312567').result,'TTNAAPTMTSUOAODWCOIXKNLXPETX','trans');
eq(C.transposition('TTNAAPTMTSUOAODWCOIXKNLXPETX','4312567',true).result.slice(0,25),'ATTACKPOSTPONEDUNTILTWOAM','trans dec');
eq(C.transposition(C.transposition('meetmeatmidnight','ZEBRAS',false,3).result,'ZEBRAS',true,3).result.slice(0,16),'MEETMEATMIDNIGHT','trans 3r');
const s='Merhaba Dünya — tekrar tekrar tekrar tekrar';
eq(C.diffXor(C.diffXor(s,'gizli','iv').result,'gizli','iv',true).result,s,'dxor');
eq(C.simpleXor(C.simpleXor(s,'gizli').result,'gizli',true).result,s,'sxor');
eq(C.simpleXor('A','A').result,'00','sxor zero');
for (const t of ['','a','ab','abc','Şifre ğüış','Merhaba Dünya!']) { eq(C.base64(t), Buffer.from(t,'utf8').toString('base64'),'b64 '+t); eq(C.base64(C.base64(t),true),t,'b64 rt '+t);}
try{C.base64('abc',true);fail++;}catch(e){console.log('OK   b64 invalid:',e.message)}
C.setLang('tr'); try{C.hill('ab',[[2,4],[6,8]])}catch(e){console.log('OK   tr err:',e.message)}
console.log(fail ? fail+' test(s) FAILED' : 'All tests passed.'); process.exit(fail?1:0);

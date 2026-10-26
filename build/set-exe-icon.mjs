// Optional: sets the KriptoLab icon and version info on the built .exe
// usage: npm i resedit pe-library && node set-exe-icon.mjs KriptoLab.exe ../icon.ico
import * as ResEdit from 'resedit';
import * as PELibrary from 'pe-library';
import fs from 'fs';
const [,, exePath, icoPath] = process.argv;
const exe = PELibrary.NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true });
const res = PELibrary.NtExecutableResource.from(exe);
const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(icoPath));
ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, 0, 1033, iconFile.icons.map(i => i.data));
const vi = ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0] || ResEdit.Resource.VersionInfo.createEmpty();
vi.setFileVersion(1,0,0,0,1033); vi.setProductVersion(1,0,0,0,1033);
vi.setStringValues({lang:1033, codepage:1200}, {
  FileDescription: 'KriptoLab - Classic Cipher Tool', ProductName: 'KriptoLab',
  FileVersion: '1.0.0', ProductVersion: '1.0.0', OriginalFilename: 'KriptoLab.exe', InternalName: 'KriptoLab', CompanyName: 'KriptoLab', LegalCopyright: ''
});
vi.outputToResourceEntries(res.entries);
res.outputResource(exe);
fs.writeFileSync(exePath, Buffer.from(exe.generate()));
console.log('patched');

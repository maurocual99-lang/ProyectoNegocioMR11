import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const version = process.argv[2];

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("Uso: npm run version:app -- 0.1.2");
  process.exit(1);
}

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontendDir = path.join(repoDir, "frontend");

function leerJson(ruta) {
  return JSON.parse(fs.readFileSync(ruta, "utf8"));
}

function escribirJson(ruta, contenido) {
  fs.writeFileSync(ruta, `${JSON.stringify(contenido, null, 2)}\n`);
}

const packagePath = path.join(frontendDir, "package.json");
const packageLockPath = path.join(frontendDir, "package-lock.json");
const tauriConfigPath = path.join(frontendDir, "src-tauri", "tauri.conf.json");
const cargoTomlPath = path.join(frontendDir, "src-tauri", "Cargo.toml");
const cargoLockPath = path.join(frontendDir, "src-tauri", "Cargo.lock");

const packageJson = leerJson(packagePath);
packageJson.version = version;
escribirJson(packagePath, packageJson);

const packageLock = leerJson(packageLockPath);
packageLock.version = version;
if (packageLock.packages?.[""]) {
  packageLock.packages[""].version = version;
}
escribirJson(packageLockPath, packageLock);

const tauriConfigText = fs.readFileSync(tauriConfigPath, "utf8");
JSON.parse(tauriConfigText);
fs.writeFileSync(
  tauriConfigPath,
  tauriConfigText.replace(/("version"\s*:\s*")[^"]+("\s*,)/, `$1${version}$2`)
);

const cargoToml = fs.readFileSync(cargoTomlPath, "utf8").replace(
  /(\[package\][\s\S]*?\nversion\s*=\s*")[^"]+("\s*)/,
  `$1${version}$2`
);
fs.writeFileSync(cargoTomlPath, cargoToml);

const cargoLock = fs.readFileSync(cargoLockPath, "utf8").replace(
  /(name = "frontend"\r?\nversion = ")[^"]+("\r?\n)/,
  `$1${version}$2`
);
fs.writeFileSync(cargoLockPath, cargoLock);

console.log(`MR11 preparado como version ${version}.`);
console.log("Revisa los cambios, compila y publica la release con el mismo numero.");

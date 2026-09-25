import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(repoDir, "frontend", "src-tauri", "tauri.conf.json");
const bundleDir = path.join(
  repoDir,
  "frontend",
  "src-tauri",
  "target",
  "release",
  "bundle",
  "nsis"
);

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const version = config.version;
const installerName = `${config.productName}_${version}_x64-setup.exe`;
const installerPath = path.join(bundleDir, installerName);
const signaturePath = `${installerPath}.sig`;

if (!fs.existsSync(installerPath) || !fs.existsSync(signaturePath)) {
  console.error(`Falta ${installerName} o su archivo .sig en ${bundleDir}.`);
  console.error("Compila sin tauri.local.conf.json y con la clave privada de actualizaciones.");
  process.exit(1);
}

const notes = process.argv.slice(2).join(" ") || `Mejoras y correcciones de MR11 ${version}.`;
const manifest = {
  version,
  notes,
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature: fs.readFileSync(signaturePath, "utf8").trim(),
      url: `https://github.com/maurocual99-lang/ProyectoNegocioMR11/releases/download/v${version}/${installerName}`,
    },
  },
};

const outputPath = path.join(bundleDir, "latest.json");
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generado: ${outputPath}`);
console.log(`Subi ${installerName}, ${installerName}.sig y latest.json a la release v${version}.`);

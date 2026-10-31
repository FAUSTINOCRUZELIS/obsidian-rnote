#!/usr/bin/env node
// Copia los artefactos de release a dist/ (main.js, manifest.json, styles.css)
// y genera dist/SHA256SUMS.txt. Uso: npm run dist
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const FILES = ["main.js", "manifest.json", "styles.css"];
const OUT = "dist";

mkdirSync(OUT, { recursive: true });

const sums = [];
for (const file of FILES) {
    copyFileSync(file, `${OUT}/${file}`);
    const hash = createHash("sha256").update(readFileSync(file)).digest("hex");
    sums.push(`${hash}  ${file}`);
    console.log(`  ${file.padEnd(14)} ${hash.slice(0, 16)}…`);
}

writeFileSync(`${OUT}/SHA256SUMS.txt`, sums.join("\n") + "\n");

const { version } = JSON.parse(readFileSync("manifest.json", "utf8"));
console.log(`\nArtefactos de la version ${version} listos en ${OUT}/`);

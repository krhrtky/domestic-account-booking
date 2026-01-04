#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const nvmrcPath = path.join(__dirname, "..", ".nvmrc");
const requiredVersion = fs.readFileSync(nvmrcPath, "utf8").trim();
const currentVersion = process.version.replace(/^v/, "").split(".")[0];

if (currentVersion !== requiredVersion) {
  console.error(`Node.js version mismatch!`);
  console.error(`  Required: v${requiredVersion}.x (see .nvmrc)`);
  console.error(`  Current:  ${process.version}`);
  console.error(`\nRun: nvm use ${requiredVersion}`);
  process.exit(1);
}

console.log(`Node.js version OK: v${process.version}`);

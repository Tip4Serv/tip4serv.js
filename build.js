const esbuild = require("esbuild");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const is_watch = process.argv.includes("--watch");

// Generate TypeScript declarations
console.log("Generating type declarations...");
try {
  execSync("npx tsc", { stdio: "inherit" });
} catch (e) {
  console.warn("Type declaration generation had issues, continuing...");
}

// Clean up extra .d.ts files, keep only tip4serv.d.ts
function clean_declarations() {
  const dist_dir = path.join(__dirname, "dist");
  if (!fs.existsSync(dist_dir)) return;
  
  const files = fs.readdirSync(dist_dir);
  for (const file of files) {
    if (file.endsWith(".d.ts") && file !== "tip4serv.d.ts") {
      fs.unlinkSync(path.join(dist_dir, file));
    }
  }
}

// Common build options
const common = {
  entryPoints: ["src/tip4serv.ts"],
  bundle: true,
  sourcemap: true,
  target: ["es2020"],
};

// Build UMD (for CDN / script tag)
async function build_umd() {
  await esbuild.build({
    ...common,
    outfile: "dist/tip4serv.js",
    format: "iife",
    globalName: "Tip4ServModule",
    footer: {
      js: "if(typeof window!=='undefined'){window.Tip4Serv=Tip4ServModule.Tip4Serv||Tip4ServModule.default;}",
    },
  });
  console.log("Built dist/tip4serv.js (UMD)");
}

// Build minified UMD
async function build_umd_min() {
  await esbuild.build({
    ...common,
    outfile: "dist/tip4serv.min.js",
    format: "iife",
    globalName: "Tip4ServModule",
    minify: true,
    footer: {
      js: "if(typeof window!=='undefined'){window.Tip4Serv=Tip4ServModule.Tip4Serv||Tip4ServModule.default;}",
    },
  });
  console.log("Built dist/tip4serv.min.js (UMD minified)");
}

// Build ESM (for modern bundlers)
async function build_esm() {
  await esbuild.build({
    ...common,
    outfile: "dist/tip4serv.esm.js",
    format: "esm",
  });
  console.log("Built dist/tip4serv.esm.js (ESM)");
}

// Main build
async function build() {
  // Ensure dist folder exists
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist");
  }

  await Promise.all([build_umd(), build_umd_min(), build_esm()]);
  clean_declarations();
  console.log("\nBuild complete!");
}

// Watch mode
async function watch() {
  const ctx = await esbuild.context({
    ...common,
    outfile: "dist/tip4serv.js",
    format: "iife",
    globalName: "Tip4ServModule",
    footer: {
      js: "if(typeof window!=='undefined'){window.Tip4Serv=Tip4ServModule.Tip4Serv||Tip4ServModule.default;}",
    },
  });

  await ctx.watch();
  console.log("Watching for changes...");
}

if (is_watch) {
  watch();
} else {
  build();
}

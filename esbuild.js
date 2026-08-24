// @ts-check
const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const extensionConfig = {
  bundle: true,
  minify: production,
  sourcemap: !production,
  sourcesContent: false,
  platform: 'node',
  entryPoints: ['src/extension/extension.ts'],
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  logLevel: 'warning',
};

async function main() {
  if (watch) {
    const extCtx = await esbuild.context(extensionConfig);
    await extCtx.watch();
    console.log('[watch] Build started — watching for changes…');
  } else {
    await esbuild.build(extensionConfig);
    console.log('[build] Extension host built.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

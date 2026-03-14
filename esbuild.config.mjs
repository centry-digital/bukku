import { build } from 'esbuild';

const shared = {
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  sourcemap: false,
};

// Bundle packages/mcp
await build({
  ...shared,
  entryPoints: ['packages/mcp/src/index.ts'],
  outfile: 'packages/mcp/build/index.js',
  external: [
    '@modelcontextprotocol/sdk',
    '@modelcontextprotocol/sdk/*',
    'zod',
  ],
  banner: {
    js: '#!/usr/bin/env node',
  },
});

console.log('Built packages/mcp/build/index.js');

// Bundle packages/cli (placeholder — built when cli has content)
// await build({
//   ...shared,
//   entryPoints: ['packages/cli/src/index.ts'],
//   outfile: 'packages/cli/build/index.js',
//   external: ['commander', 'zod'],
//   banner: {
//     js: '#!/usr/bin/env node',
//   },
// });

import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { build, createServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { root } from './snapshot.mjs';

const config = {
  root,
  configFile: false,
  server: { middlewareMode: true },
  appType: 'custom',
  resolve: { alias: { '#lib': resolve(root, 'src/lib') } },
  plugins: [svelte({
    extensions: ['.svelte', '.svx'],
    compilerOptions: { css: 'injected' },
    preprocess: mdsvex({
      extensions: ['.svx'],
      layout: { runbook: resolve(root, 'src/lib/layouts/runbook.svelte') },
    }),
  })],
};

await build({
  ...config,
  build: {
    outDir: resolve(root, 'rendered/_assets'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(root, 'scripts/client.mjs'),
      output: { entryFileNames: 'client.js' },
    },
  },
});

const server = await createServer(config);

function pages(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? pages(path) : entry.name === '+page.svx' ? [path] : [];
  });
}

try {
  const { render } = await server.ssrLoadModule('svelte/server');
  const routes = resolve(root, 'src/routes');
  for (const page of pages(resolve(routes, 'kb'))) {
    const mod = await server.ssrLoadModule(page);
    const result = render(mod.default);
    const path = resolve(root, 'rendered', relative(routes, dirname(page)), 'index.html');
    mkdirSync(dirname(path), { recursive: true });
    const source = `/${relative(root, page).split('\\').join('/')}`;
    const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="kb-source" content="${source}">${result.head}<script type="module" src="/_assets/client.js"></script></head><body>${result.body}</body></html>\n`;
    writeFileSync(path, html);
    console.log(`Rendered ${relative(root, page)} → ${relative(root, path)}`);
  }
} finally {
  await server.close();
}

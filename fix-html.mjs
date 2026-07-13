import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = resolve(__dirname, 'dist');
const assetsPath = resolve(distPath, 'assets');
const htmlPath = resolve(distPath, 'index.html');
const html = readFileSync(htmlPath, 'utf8');

const assets = readdirSync(assetsPath);
const css = assets.find(f => f.startsWith('index-') && f.endsWith('.css'));
const js = assets.find(f => f.startsWith('index-') && f.endsWith('.js'));

const fixed = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Legacy.EXE</title>
    <link rel="icon" type="image/png" href="/icons/icon-192.png" />
    <link rel="stylesheet" crossorigin href="/assets/${css}" />
    <link rel="manifest" href="/manifest.webmanifest" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" crossorigin src="/assets/${js}"></script>
  </body>
</html>`;

writeFileSync(htmlPath, fixed);
console.log('Fixed dist/index.html');

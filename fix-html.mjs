import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, 'dist/index.html');
const html = readFileSync(htmlPath, 'utf8');

// Fix malformed HTML from vite-plugin-pwa
// The plugin generates malformed link tags and incorrect element ordering
const fixed = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Legacy.EXE</title>
    <link rel="stylesheet" crossorigin href="/assets/index-C1N7b68y.css" />
    <link rel="manifest" href="/manifest.webmanifest" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" crossorigin src="/assets/index-DtukX81_.js"></script>
  </body>
</html>`;

writeFileSync(htmlPath, fixed);
console.log('Fixed dist/index.html');
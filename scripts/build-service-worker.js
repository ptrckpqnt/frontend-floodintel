import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const [worker, index, assets] = await Promise.all([
  readFile(new URL('../service-worker.js', import.meta.url), 'utf8'),
  readFile(new URL('index.html', dist)),
  readdir(new URL('assets/', dist), { withFileTypes: true }),
]);

const files = ['/index.html', ...assets.filter((entry) => entry.isFile())
  .map((entry) => '/assets/' + entry.name).sort()];
const version = createHash('sha256').update(worker).update(index).update(files.join('\n')).digest('hex').slice(0, 16);

await writeFile(new URL('service-worker.js', dist),
  `const version = ${JSON.stringify(version)};\nconst files = ${JSON.stringify(files)};\n${worker}`);

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const serverDir = join(rootDir, 'server');

mkdirSync(distDir, { recursive: true });

if (existsSync(serverDir)) {
  rmSync(join(distDir, 'server'), { recursive: true, force: true });
  cpSync(serverDir, join(distDir, 'server'), {
    recursive: true,
    filter: (source) => {
      if (source.includes('node_modules')) return false;
      if (source.endsWith('.env')) return false;
      return true;
    }
  });
}

console.log('Build concluido: cliente em dist/client e servidor preparado em dist/server.');

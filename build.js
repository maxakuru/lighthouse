import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import { config as configEnv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

configEnv();
process.env.NODE_ENV ??= 'development';
const dev = process.env.NODE_ENV === 'development';

try {
  await build({
    bundle: true,
    sourcemap: dev,
    format: 'esm',
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    tsconfig: path.resolve(__dirname, './tsconfig.json'),
    target: 'esnext',
    external: ['@sparticuz/chromium'],
    conditions: ['worker', 'browser'],
    entryPoints: [path.resolve(__dirname, 'src', 'index.ts')],
    outdir: path.resolve(__dirname, 'dist'),
  });
} catch {
  process.exitCode = 1;
}

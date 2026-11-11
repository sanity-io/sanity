// oxlint-disable no-console
// Builds the Rust studio into a static app served at `/rust/`.
//
//   node scripts/build.mjs [--out <dir>] [--dev] [--optional]
//
// `--out` defaults to `dist`. `--dev` builds the debug profile, which compiles much faster.
// `--optional` is how the test studio's build calls it: the Rust build then only runs on Vercel or
// when `SANITY_RUST_STUDIO=true`, so JS-only builds never wait for a Rust toolchain. On Vercel,
// where no Rust toolchain is installed, rustup is installed first, and `rust-toolchain.toml`
// picks the compiler. The wasm-bindgen CLI is downloaded into `target/tools`.
//
// There is no wasm-opt pass: with `opt-level = "z"` it shrinks the raw module but makes the
// gzip and brotli transfer sizes larger at every level from -O2 up, and -O1 saves under 1%.
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {delimiter, dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {parseArgs} from 'node:util'
import {brotliCompressSync, gzipSync} from 'node:zlib'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const targetDir = resolve(root, process.env.CARGO_TARGET_DIR ?? 'target')
const BASE_PATH = '/rust'
const CRATE = 'sanity_studio'

const {values: args} = parseArgs({
  options: {
    out: {type: 'string', default: 'dist'},
    dev: {type: 'boolean', default: false},
    optional: {type: 'boolean', default: false},
  },
})

// Under turbo's strict env mode, this needs `VERCEL` declared on the test studio's build task.
const onVercel = Boolean(process.env.VERCEL)
if (args.optional && !onVercel && process.env.SANITY_RUST_STUDIO !== 'true') {
  console.log('Skipping the Rust studio, set SANITY_RUST_STUDIO=true to build it into /rust/')
  process.exit(0)
}

const outDir = resolve(args.out)
const started = performance.now()

function run(command, commandArgs) {
  console.log(`$ ${command} ${commandArgs.join(' ')}`)
  const result = spawnSync(command, commandArgs, {stdio: 'inherit', cwd: root})
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${command} exited with ${result.status ?? result.signal}`)
  }
}

function output(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {cwd: root, encoding: 'utf8'})
  return result.status === 0 ? result.stdout.trim() : null
}

function ensureCargo() {
  if (output('cargo', ['--version'])) return
  const cargoBin = join(process.env.CARGO_HOME ?? join(homedir(), '.cargo'), 'bin')
  process.env.PATH = `${cargoBin}${delimiter}${process.env.PATH}`
  if (output('cargo', ['--version'])) return
  if (!onVercel) {
    throw new Error(
      'cargo is not installed, see https://rustup.rs (rust-toolchain.toml picks the version)',
    )
  }
  run('sh', [
    '-c',
    'curl --proto =https --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain none',
  ])
}

// The CLI must match the `wasm-bindgen` crate version exactly; Cargo.lock pins it.
function wasmBindgen() {
  const lock = readFileSync(join(root, 'Cargo.lock'), 'utf8')
  const version = lock.match(/name = "wasm-bindgen"\nversion = "([^"]+)"/)?.[1]
  if (!version) throw new Error('wasm-bindgen is missing from Cargo.lock')
  if (output('wasm-bindgen', ['--version'])?.endsWith(` ${version}`)) return 'wasm-bindgen'

  const targets = {
    'linux-x64': 'x86_64-unknown-linux-musl',
    'linux-arm64': 'aarch64-unknown-linux-musl',
    'darwin-x64': 'x86_64-apple-darwin',
    'darwin-arm64': 'aarch64-apple-darwin',
  }
  const target = targets[`${process.platform}-${process.arch}`]
  if (!target) {
    throw new Error(
      `Install wasm-bindgen-cli ${version}, there is no prebuilt one for this platform`,
    )
  }
  const dir = join(targetDir, 'tools')
  const bin = join(dir, `wasm-bindgen-${version}-${target}`, 'wasm-bindgen')
  if (!existsSync(bin)) {
    mkdirSync(dir, {recursive: true})
    const url = `https://github.com/wasm-bindgen/wasm-bindgen/releases/download/${version}/wasm-bindgen-${version}-${target}.tar.gz`
    run('sh', ['-c', `curl -sSfL "${url}" | tar -xz -C "${dir}"`])
  }
  return bin
}

function hash(buffer) {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 10)
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(0)} kB`
}

function fontFace(file, style, weight) {
  return `@font-face { font-family: Inter; font-style: ${style}; font-weight: ${weight}; font-display: swap; src: url("https://studio-static.sanity.io/Inter-${file}.woff2") format("woff2"); }`
}

const FONTS = [
  ['Regular', 400],
  ['Medium', 500],
  ['SemiBold', 600],
  ['Bold', 700],
  ['ExtraBold', 800],
  ['Black', 900],
].flatMap(([name, weight]) => [
  fontFace(name, 'normal', weight),
  fontFace(name === 'Regular' ? 'Italic' : `${name}Italic`, 'italic', weight),
])

// The document globals of the JS studio's `DefaultDocument` (`@sanity/cli-build`), so both studios
// load the same fonts and paint the same background before the app renders.
function document({js, wasm}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
    <meta name="robots" content="noindex" />
    <meta name="referrer" content="same-origin" />
    <link rel="icon" href="/static/favicon.ico" sizes="any" />
    <link rel="icon" href="/static/favicon.svg" type="image/svg+xml" />
    <title>Sanity Studio (Rust)</title>
    <link rel="modulepreload" href="${BASE_PATH}/${js}" />
    <link rel="preload" href="${BASE_PATH}/${wasm}" as="fetch" type="application/wasm" crossorigin />
    <style>
      ${FONTS.join('\n      ')}
      html { background-color: #ffffff; }
      @media (prefers-color-scheme: dark) { html { background-color: #13141b; } }
      html, body { height: 100%; }
      body { margin: 0; -webkit-font-smoothing: antialiased; }
    </style>
  </head>
  <body>
    <script type="module">
      import init from '${BASE_PATH}/${js}'
      init({module_or_path: '${BASE_PATH}/${wasm}'})
    </script>
    <noscript>The Rust studio needs JavaScript and WebAssembly.</noscript>
  </body>
</html>
`
}

ensureCargo()
const profile = args.dev ? 'debug' : 'release'
run('cargo', [
  'build',
  '--target',
  'wasm32-unknown-unknown',
  '-p',
  'sanity-studio',
  ...(args.dev ? [] : ['--release']),
])

const bindgenDir = join(targetDir, 'bindgen')
rmSync(bindgenDir, {recursive: true, force: true})
run(wasmBindgen(), [
  '--target',
  'web',
  '--no-typescript',
  '--remove-name-section',
  '--remove-producers-section',
  '--out-dir',
  bindgenDir,
  '--out-name',
  CRATE,
  join(targetDir, `wasm32-unknown-unknown/${profile}/${CRATE}.wasm`),
])

const wasmBytes = readFileSync(join(bindgenDir, `${CRATE}_bg.wasm`))
const jsBytes = readFileSync(join(bindgenDir, `${CRATE}.js`))
const files = {
  js: `${CRATE}-${hash(jsBytes)}.js`,
  wasm: `${CRATE}_bg-${hash(wasmBytes)}.wasm`,
}

if (`${root}/`.startsWith(`${outDir}/`)) {
  throw new Error(`Refusing to replace ${outDir}, which contains the Rust workspace`)
}
rmSync(outDir, {recursive: true, force: true})
mkdirSync(outDir, {recursive: true})
writeFileSync(join(outDir, files.js), jsBytes)
writeFileSync(join(outDir, files.wasm), wasmBytes)
writeFileSync(join(outDir, 'index.html'), document(files))

const seconds = ((performance.now() - started) / 1000).toFixed(1)
console.log(
  `Built the Rust studio into ${outDir} in ${seconds}s: ${files.wasm} ${kb(wasmBytes.length)} ` +
    `(${kb(gzipSync(wasmBytes).length)} gzip, ${kb(brotliCompressSync(wasmBytes).length)} brotli), ` +
    `${files.js} ${kb(jsBytes.length)}`,
)

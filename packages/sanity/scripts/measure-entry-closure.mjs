#!/usr/bin/env node
/* oxlint-disable no-console -- CLI script */
/**
 * Measures the transitive *static* import closure of entries of the CDN auto-update bundle
 * (`pnpm --filter sanity build:bundle`, output in `dist/`): the files a browser downloads before
 * it can evaluate the entry, which for an auto-updating studio is the login-page payload (the
 * import map points `sanity` and `sanity/*` at the module host and nothing is tree-shaken).
 *
 * Usage, from packages/sanity after `pnpm build:bundle`:
 *
 *   pnpm measure:entry-closure                      # the `sanity` entry (index.mjs)
 *   pnpm measure:entry-closure index structure      # `sanity` + `sanity/structure`
 *   pnpm measure:entry-closure --top=20 index       # also list the largest files
 *
 * Only static `import` statements are followed (relative specifiers and `sanity/<x>`); dynamic
 * `import()` is what keeps code off this path. `react`, `react-dom` and `styled-components` come
 * from the import map and are excluded.
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import zlib from 'node:zlib'

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const args = process.argv.slice(2)
const top = Number(args.find((arg) => arg.startsWith('--top='))?.slice('--top='.length) ?? 0)
const entries = args.filter((arg) => !arg.startsWith('--')).map((name) => `${name}.mjs`)
if (entries.length === 0) entries.push('index.mjs')

// Static import statements as rolldown emits them at the top of a minified chunk:
// `import{a as b}from"./x.mjs";`, `import"./x.mjs";`, `import*as x from"./x.mjs";`.
// Dynamic imports are `import("./x.mjs")` and do not match (they need `(`).
const STATIC_IMPORT_RE = /(?:^|[;}\n])import\s*(?:[^"'`();]*?\bfrom\s*)?["']([^"']+)["']/g

function resolveSpecifier(fromFile, specifier) {
  if (specifier.startsWith('.')) return path.resolve(path.dirname(fromFile), specifier)
  if (specifier === 'sanity') return path.join(distDir, 'index.mjs')
  if (specifier.startsWith('sanity/')) {
    const candidate = path.join(distDir, `${specifier.slice('sanity/'.length)}.mjs`)
    return fs.existsSync(candidate) ? candidate : null
  }
  return null
}

function staticClosure(entryFiles) {
  const seen = new Set()
  const queue = entryFiles.map((entry) => path.join(distDir, entry))
  while (queue.length > 0) {
    const file = queue.pop()
    if (seen.has(file)) continue
    if (!fs.existsSync(file)) {
      console.error(`missing ${path.relative(distDir, file)} (run \`pnpm build:bundle\` first)`)
      process.exit(1)
    }
    seen.add(file)
    const source = fs.readFileSync(file, 'utf8')
    for (const match of source.matchAll(STATIC_IMPORT_RE)) {
      const resolved = resolveSpecifier(file, match[1])
      if (resolved) queue.push(resolved)
    }
  }
  return [...seen]
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`

const files = staticClosure(entries).map((file) => {
  const buffer = fs.readFileSync(file)
  return {
    file: path.relative(distDir, file),
    raw: buffer.length,
    gzip: zlib.gzipSync(buffer, {level: 9}).length,
  }
})
const raw = files.reduce((sum, file) => sum + file.raw, 0)
const gzip = files.reduce((sum, file) => sum + file.gzip, 0)

console.log(`entries: ${entries.join(', ')}`)
console.log(`static closure: ${files.length} files, ${kb(raw)} raw, ${kb(gzip)} gzip`)
if (top > 0) {
  console.log(`\nlargest files (gzip):`)
  for (const file of files.sort((a, b) => b.gzip - a.gzip).slice(0, top)) {
    console.log(`  ${kb(file.gzip).padStart(10)}  ${kb(file.raw).padStart(10)} raw  ${file.file}`)
  }
}

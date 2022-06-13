#!/usr/bin/env node
/* eslint-disable no-console, no-process-exit, no-sync */
const path = require('path')
const fs = require('fs')
const {spawnSync} = require('child_process')

const baseDir = path.join(__dirname, '..')
const modulesDir = path.join(baseDir, 'node_modules')
const isAllowedNativeModule = (mod) => {
  const modName = mod.path.slice(modulesDir.length + 1).split(path.sep)[0]
  return !['fsevents'].includes(modName)
}

console.log('Building CLI to a single file')

// Make sure there are no native modules
const isBinding = (file) => path.basename(file.path) === 'binding.gyp'
const bindings = readdirRecursive(modulesDir).filter(isBinding).filter(isAllowedNativeModule)

if (bindings.length > 0) {
  console.error('Eek! Found native module at:')
  bindings.forEach((file) => console.error(file.path))
  process.exit(1)
}

const openDir = path.dirname(require.resolve('open'))
const xdgPath = path.join(openDir, 'xdg-open')
fs.copyFileSync(xdgPath, path.join(baseDir, 'bin', 'xdg-open'))

spawnSync(
  'esbuild',
  [
    'bin/entry.js',
    '--bundle',
    '--sourcemap',
    '--format=cjs',
    '--outfile=bin/sanity-cli.js',
    '--platform=node',
    '--target=node14',
    '--external:esbuild-register',
    '--external:pkg-dir',
  ],
  {encoding: 'utf8', stdio: 'inherit', cwd: baseDir}
)

// Make the files executable
fs.chmodSync(path.join(baseDir, 'bin', 'sanity'), 0o755)
fs.chmodSync(path.join(baseDir, 'bin', 'sanity-cli.js'), 0o755)

function readdirRecursive(dir) {
  let content = []

  const currentPath = path.resolve(dir)
  const dirContent = fs.readdirSync(currentPath).map((item) => path.join(currentPath, item))

  for (const subPath of dirContent) {
    const stat = fs.statSync(subPath)
    const isDir = stat.isDirectory()
    content.push({path: subPath, isDir})

    if (isDir) {
      content = content.concat(readdirRecursive(subPath))
    }
  }

  return content
}

export function detectRuntime() {
  if ('Deno' in globalThis) {
    return 'deno'
  }
  if ('Bun' in globalThis) {
    return 'bun'
  }
  // Consider using a more reliable way of detecting that we're actually in Node.js
  // I first attempted using https://www.npmjs.com/package/is-really-node, but it fails
  // due to using top level await.
  return 'node'
}

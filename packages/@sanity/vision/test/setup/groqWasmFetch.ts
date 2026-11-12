import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'

// The lazy entry of `@sanity-labs/groq-wasm` fetches its `.wasm` next to the module, and Node's
// fetch cannot read `file:` URLs. Serve those from disk so the real loader runs under test.
const nodeFetch = globalThis.fetch

globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(input instanceof Request ? input.url : String(input))
  if (url.protocol !== 'file:') return nodeFetch(input, init)
  return Promise.resolve(
    new Response(readFileSync(fileURLToPath(url)), {
      headers: {'content-type': 'application/wasm'},
    }),
  )
}

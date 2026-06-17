#!/usr/bin/env node
// Out-of-band patch script for https://github.com/sanity-io/sanity/issues/5313.
//
// Run from a second terminal while the Studio (default workspace) has a
// document of type `issue5313DottedLhsFilter` open.
//
// Usage:
//   node dev/test-studio/schema/debug/issue5313DottedLhsFilter.fire-patch.mjs <docId> <mode>
//
// Where:
//   <docId>  the _id of the open document (visible in the URL bar and in the
//            JSON inspector at the bottom of the form).
//   <mode>   "broken" — patches `brokenArr[asset._ref == "<ref>"]` (this is
//                       the dotted-LHS filter that crashes the open Studio
//                       tab with `Error: Expected ]` from @sanity/mutator).
//            "control" — patches `keyedArr[_key == "<key>"]` (workaround,
//                        should NOT crash the open Studio).
//
// Environment:
//   SANITY_PROJECT_ID, SANITY_DATASET — the project/dataset the test-studio is
//     connected to. Defaults match `sanity.cli.ts` / `sanity.config.ts` in
//     this test-studio (`ppsg7ml5` / `test`) — override if you've pointed the
//     studio at something else.
//   SANITY_AUTH_TOKEN — a write token for the dataset. Required.
//
// Why a separate script: the bug only fires when the patch arrives over the
// real-time channel, NOT when issued from the open Studio session itself.

import {createClient} from '@sanity/client'

const [, , docId, mode] = process.argv
if (!docId || !mode || !['broken', 'control'].includes(mode)) {
  console.error('Usage: node issue5313DottedLhsFilter.fire-patch.mjs <docId> <broken|control>')
  process.exit(2)
}

const projectId = process.env.SANITY_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_DATASET || 'test'
const token = process.env.SANITY_AUTH_TOKEN
if (!token) {
  console.error('SANITY_AUTH_TOKEN is required (write token for the dataset).')
  process.exit(2)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const doc = await client.getDocument(docId)
if (!doc) {
  console.error(`Document ${docId} not found in ${projectId}/${dataset}.`)
  process.exit(1)
}

const stamp = new Date().toISOString().slice(11, 19)

if (mode === 'broken') {
  const first = (doc.brokenArr || [])[0]
  if (!first || !first.asset || !first.asset._ref) {
    console.error(
      'No brokenArr item with `asset._ref` found on the document. Add at least one in the Studio first, then publish.',
    )
    process.exit(1)
  }
  const ref = first.asset._ref
  const selector = `brokenArr[asset._ref == "${ref}"]`
  console.log(`Patching ${docId} with selector: ${selector}`)
  await client
    .patch(docId)
    .set({[`brokenArr[asset._ref == "${ref}"].label`]: `patched broken at ${stamp}`})
    .commit({autoGenerateArrayKeys: true})
  console.log(
    'Server accepted the mutation. Switch back to the Studio tab — it should now be stuck with `Error: Expected ]` in the console and the document view broken until full reload.',
  )
} else {
  const first = (doc.keyedArr || [])[0]
  if (!first || !first._key) {
    console.error(
      'No keyedArr item with `_key` found on the document. Add at least one in the Studio first, then publish.',
    )
    process.exit(1)
  }
  const key = first._key
  const selector = `keyedArr[_key == "${key}"]`
  console.log(`Patching ${docId} with selector: ${selector}`)
  await client
    .patch(docId)
    .set({[`keyedArr[_key == "${key}"].label`]: `patched control at ${stamp}`})
    .commit({autoGenerateArrayKeys: true})
  console.log(
    'Server accepted the mutation. Switch back to the Studio tab — the new label should appear in the form without a crash.',
  )
}

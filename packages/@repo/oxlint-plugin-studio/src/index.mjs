/**
 * In-repo oxlint jsPlugin with rules for studio code. Loaded from `.oxlintrc.json` via the
 * `jsPlugins` entry named `@repo/studio`.
 */

const INTERNALS = 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
const FIRST_LOAD = `${INTERNALS}-1`
const LAZY_ONLY = `${INTERNALS}-2`

/** @param {unknown} source */
function isDisallowedInternals(source) {
  if (typeof source !== 'string') return false
  return source === INTERNALS || (source.startsWith(`${INTERNALS}-`) && source !== FIRST_LOAD)
}

/** @param {{importKind?: string, exportKind?: string, specifiers?: {importKind?: string, exportKind?: string}[]}} node */
function isTypeOnly(node) {
  if (node.importKind === 'type' || node.exportKind === 'type') return true
  const specifiers = node.specifiers ?? []
  return (
    specifiers.length > 0 &&
    specifiers.every((s) => s.importKind === 'type' || s.exportKind === 'type')
  )
}

/**
 * Disallow static imports of the private internals entry, other than its `…-1` subpath, in a
 * studio config.
 *
 * A studio evaluates its config, and every module the config imports statically, before it
 * renders the login screen, so whatever the config imports is downloaded before the user has
 * signed in. Only `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-1` is
 * meant for that: the bare entry and its other subpaths are large, and `…-2` holds the internals
 * that only lazily loaded code may use. Type-only imports and dynamic `import()` calls are fine.
 * The rule only sees the config's own imports; the `first-load` and `shell-load` tests in
 * `@repo/test-exports` check the whole graph.
 */
const noInternalsBeforeSignIn = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing private internals other than their -1 subpath in code that runs before sign-in',
    },
    messages: {
      lazyOnly: `\`${LAZY_ONLY}\` holds the internals that only lazily loaded code may use (the document stack: forms and inputs, field diffs, comments, document panes), and a studio config is evaluated before sign-in. Import its names from code behind a lazy boundary (a \`lazy()\` tool, input or document component, or a dynamic \`import()\` that destructures the names it uses).`,
      beforeSignIn: `\`{{source}}\` would be loaded before the login screen: a studio config, and every module it imports statically, is evaluated before sign-in, and only \`${FIRST_LOAD}\` may be part of that. Import the name from \`${FIRST_LOAD}\` (moving it to packages/sanity/src/_exports/_dangerously_use_private_internals_that_do_not_follow_semver-1.ts if a studio needs it up front), or load the code that uses it with a dynamic \`import()\` so it is fetched after sign-in.`,
    },
    schema: [],
  },
  create(context) {
    /** @param {any} node */
    function check(node) {
      if (!node.source || !isDisallowedInternals(node.source.value) || isTypeOnly(node)) return
      context.report({
        node: node.source,
        messageId: node.source.value === LAZY_ONLY ? 'lazyOnly' : 'beforeSignIn',
        data: {source: node.source.value},
      })
    }
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    }
  },
}

export default {
  meta: {name: '@repo/studio'},
  rules: {
    'no-internals-before-sign-in': noInternalsBeforeSignIn,
  },
}

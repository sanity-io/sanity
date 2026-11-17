import {readFileSync, statSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {parseSync, visitorKeys} from 'oxc-parser'

import {namespaces as defaultNamespaces} from './namespaces.mjs'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')

/** i18next's default namespace in the studio (`core/i18n/i18nConfig.ts`) */
const DEFAULT_NAMESPACE = 'studio'

const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
])

/**
 * Shared options schema for the rules: both take the namespace table and the directory its
 * paths are relative to, so tests can point them at fixtures.
 */
export const optionsSchema = [
  {
    type: 'object',
    properties: {
      rootDir: {type: 'string'},
      namespaces: {type: 'object'},
    },
    additionalProperties: false,
  },
]

/**
 * Resolved configurations, so the table is only resolved once per process. Lint runs use the
 * default table; options (with their own cache entry) are for tests. Each resource's `keys` is
 * re-read when its file changes, so a long-lived process (`oxlint --lsp`) never serves stale keys.
 */
const configCache = new Map()

const resourceKeysCache = new Map()

function currentResourceKeys(file) {
  const {mtimeMs} = statSync(file)
  const cached = resourceKeysCache.get(file)
  if (cached?.mtimeMs === mtimeMs) return cached.keys
  const keys = readResourceKeys(file)
  resourceKeysCache.set(file, {mtimeMs, keys})
  return keys
}

function getConfig(options) {
  const cacheKey = options ? JSON.stringify(options) : ''
  const cached = configCache.get(cacheKey)
  if (cached) return cached

  const rootDir = options?.rootDir ?? REPO_ROOT
  const table = options?.namespaces ?? defaultNamespaces

  const constants = new Map()
  const entries = new Map()
  for (const [namespace, entry] of Object.entries(table)) {
    for (const constant of entry.constants ?? []) constants.set(constant, namespace)
    entries.set(namespace, {
      ...entry,
      resources: entry.resources.map((file) => ({
        file,
        home: file.includes('/i18n/') ? `${file.slice(0, file.indexOf('/i18n/'))}/` : null,
        get keys() {
          return currentResourceKeys(path.join(rootDir, file))
        },
      })),
    })
  }

  const config = {rootDir, constants, entries}
  configCache.set(cacheKey, config)
  return config
}

/** The object literal behind `{...} as const` / `{...} satisfies T`, if that is what `node` is */
function unwrapTypeAssertions(node) {
  let current = node
  while (current?.type === 'TSAsExpression' || current?.type === 'TSSatisfiesExpression') {
    current = current.expression
  }
  return current?.type === 'ObjectExpression' ? current : undefined
}

/**
 * Reads the keys of a locale resource file: the object literal passed to
 * `defineLocalesResources()`, or else the first top level `const` initialized with one.
 */
function readResourceKeys(file) {
  const {program, errors} = parseSync(file, readFileSync(file, 'utf8'))
  if (errors.length > 0) throw new Error(`Failed to parse ${file}: ${errors[0].message}`)

  let strings
  const visit = (node) => {
    if (strings || !node || typeof node.type !== 'string') return
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      node.callee.name === 'defineLocalesResources'
    ) {
      strings = unwrapTypeAssertions(node.arguments[1])
      return
    }
    for (const key of visitorKeys[node.type] ?? []) {
      const child = node[key]
      if (Array.isArray(child)) child.forEach(visit)
      else visit(child)
    }
  }
  visit(program)

  if (!strings) {
    strings = program.body
      .map((statement) =>
        statement.type === 'VariableDeclaration'
          ? unwrapTypeAssertions(statement.declarations[0]?.init)
          : undefined,
      )
      .find(Boolean)
  }
  if (!strings) throw new Error(`No locale resources found in ${file}`)

  const keys = new Set()
  for (const property of strings.properties) {
    if (property.type !== 'Property' || property.computed) continue
    if (property.key.type === 'Identifier') keys.add(property.key.name)
    else if (typeof property.key.value === 'string') keys.add(property.key.value)
  }
  return keys
}

/**
 * Whether `key` resolves in a set of resource keys. When the read can pass `count` or `context`
 * (`allowsVariants`), i18next plural and context variants (`key_one`, `key_other`, `key_draft`,
 * ...) count as the key itself; a bare read of a key that only has variants renders raw.
 */
export function hasKey(keys, key, allowsVariants) {
  if (keys.has(key)) return true
  const prefix = `${key}_`
  return allowsVariants && [...keys].some((candidate) => candidate.startsWith(prefix))
}

/** Static string values an expression can evaluate to, or `null` when it is not static */
function staticStrings(node) {
  if (!node) return null
  if (node.type === 'Literal' && typeof node.value === 'string') return [node.value]
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return [node.quasis[0].value.cooked]
  }
  if (node.type === 'JSXExpressionContainer') return staticStrings(node.expression)
  if (node.type === 'ConditionalExpression') {
    const consequent = staticStrings(node.consequent)
    const alternate = staticStrings(node.alternate)
    return consequent && alternate ? [...consequent, ...alternate] : null
  }
  return null
}

function getProperty(objectExpression, name) {
  return objectExpression.properties.find(
    (property) =>
      property.type === 'Property' &&
      !property.computed &&
      (property.key.type === 'Identifier'
        ? property.key.name === name
        : property.key.value === name),
  )
}

/**
 * Whether a read's options can select a plural or context variant: they carry `count` or
 * `context`, or cannot be inspected (not an object literal, or spread into one).
 */
function optionsAllowVariants(options) {
  if (options?.type !== 'ObjectExpression') return Boolean(options)
  return (
    options.properties.some((property) => property.type === 'SpreadElement') ||
    Boolean(getProperty(options, 'count') || getProperty(options, 'context'))
  )
}

function getJsxAttribute(openingElement, name) {
  return openingElement.attributes.find(
    (attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === name,
  )
}

/** Names bound by a function's parameters, to detect a `t` that shadows an outer one */
function paramNames(fn) {
  const names = new Set()
  const collect = (pattern) => {
    if (!pattern) return
    if (pattern.type === 'Identifier') names.add(pattern.name)
    else if (pattern.type === 'AssignmentPattern') collect(pattern.left)
    else if (pattern.type === 'RestElement') collect(pattern.argument)
    else if (pattern.type === 'ArrayPattern') pattern.elements.forEach(collect)
    else if (pattern.type === 'ObjectPattern') {
      for (const property of pattern.properties) {
        collect(property.type === 'RestElement' ? property.argument : property.value)
      }
    }
  }
  fn.params.forEach(collect)
  return names
}

/**
 * Walks a file and reports every place it reads a locale namespace, and every statically known
 * translation key together with the namespace it is read from.
 *
 * Covered:
 * - `useTranslation(ns)` (no argument, or `''`, is the default `studio` namespace)
 * - `t('key')` and `<Translate t={t} i18nKey="key" />`, where `t` is destructured from a
 *   `useTranslation()` call in an enclosing function (`const {t} = ...`, `const {t: tCore} = ...`)
 * - `t('key', {ns})`, and `{key: 'key', ns}` objects (the `i18n` option of structure builders,
 *   menu items and the like)
 *
 * Namespace arguments resolve when they are string literals or identifiers imported under one
 * of the names in the table's `constants`. Keys resolve when they are string literals (or a
 * conditional between two). Everything else (a `t` passed in as a prop, a key computed at
 * runtime) is skipped.
 *
 * @param context - the rule context
 * @param handlers - optional `onNamespace({node, namespace, entry})` and `onKey({node, namespace, key, allowsVariants, entry})`,
 *   where `entry` is the namespace's table entry, or `undefined` for an unknown namespace
 */
export function createTranslationVisitor(context, {onNamespace, onKey}) {
  const config = getConfig(context.options[0])
  /** local identifier -> namespace, from imports of the known constants */
  const importedNamespaces = new Map()
  /** `t` bindings: {name, scope, namespace, keyPrefix} */
  const bindings = []
  /** calls with a static key, resolved once all bindings are known: {node, name, keyNode, nsOverride} */
  const keyReads = []

  function resolveNamespace(node) {
    if (!node) return DEFAULT_NAMESPACE
    if (node.type === 'Literal' && typeof node.value === 'string') {
      return node.value || DEFAULT_NAMESPACE
    }
    if (node.type === 'Identifier') return importedNamespaces.get(node.name) ?? null
    return null
  }

  function enclosingScope(node) {
    let current = node.parent
    while (current && !FUNCTION_TYPES.has(current.type) && current.type !== 'Program') {
      current = current.parent
    }
    return current
  }

  /** Finds the `t` binding a call site sees, walking out through the enclosing functions */
  function findBinding(node, name) {
    let current = node.parent
    while (current) {
      if (FUNCTION_TYPES.has(current.type) || current.type === 'Program') {
        const binding = bindings.find((b) => b.name === name && b.scope === current)
        if (binding) return binding
        if (current.type !== 'Program' && paramNames(current).has(name)) return null
      }
      current = current.parent
    }
    return null
  }

  function readNamespace(node, namespace) {
    if (namespace) onNamespace?.({node, namespace, entry: config.entries.get(namespace)})
  }

  function readKeys(node, namespace, keyNode, keyPrefix, allowsVariants = false) {
    const keys = staticStrings(keyNode)
    if (!onKey || !namespace || !keys) return
    for (const rawKey of keys) {
      const key = keyPrefix ? `${keyPrefix}.${rawKey}` : rawKey
      onKey({
        node: keyNode ?? node,
        namespace,
        key,
        allowsVariants,
        entry: config.entries.get(namespace),
      })
    }
  }

  return {
    'ImportDeclaration'(node) {
      for (const specifier of node.specifiers) {
        if (specifier.type !== 'ImportSpecifier') continue
        const importedName = specifier.imported.name ?? specifier.imported.value
        const namespace = config.constants.get(importedName)
        if (namespace) importedNamespaces.set(specifier.local.name, namespace)
      }
    },

    'CallExpression'(node) {
      const callee = node.callee
      if (callee.type !== 'Identifier') return

      if (callee.name === 'useTranslation') {
        const [nsArg, optionsArg] = node.arguments
        const nsNodes = nsArg?.type === 'ArrayExpression' ? nsArg.elements : [nsArg]
        const resolved = nsNodes.map((nsNode) => resolveNamespace(nsNode))
        nsNodes.forEach((nsNode, index) => readNamespace(nsNode ?? node, resolved[index]))

        const declarator = node.parent
        if (declarator?.type !== 'VariableDeclarator' || declarator.id.type !== 'ObjectPattern') {
          return
        }
        const tProperty = getProperty(declarator.id, 't')
        if (tProperty?.value.type !== 'Identifier') return

        const keyPrefixProperty =
          optionsArg?.type === 'ObjectExpression' ? getProperty(optionsArg, 'keyPrefix') : null
        bindings.push({
          name: tProperty.value.name,
          scope: enclosingScope(node),
          // With an array of namespaces, `t` looks keys up in the first one
          namespace: resolved[0],
          keyPrefix: keyPrefixProperty ? staticStrings(keyPrefixProperty.value)?.[0] : undefined,
        })
        return
      }

      const [keyNode, optionsArg] = node.arguments
      if (!staticStrings(keyNode)) return
      const nsProperty =
        optionsArg?.type === 'ObjectExpression' ? getProperty(optionsArg, 'ns') : null
      keyReads.push({
        node,
        name: callee.name,
        keyNode,
        nsOverride: nsProperty?.value,
        allowsVariants: optionsAllowVariants(optionsArg),
      })
    },

    'JSXOpeningElement'(node) {
      if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'Translate') return
      const tAttribute = getJsxAttribute(node, 't')
      const keyAttribute = getJsxAttribute(node, 'i18nKey')
      const tExpression = tAttribute?.value?.expression
      if (tExpression?.type !== 'Identifier' || !keyAttribute) return
      const valuesAttribute = getJsxAttribute(node, 'values')
      keyReads.push({
        node,
        name: tExpression.name,
        keyNode: keyAttribute.value,
        allowsVariants:
          Boolean(getJsxAttribute(node, 'context')) ||
          optionsAllowVariants(valuesAttribute?.value?.expression),
      })
    },

    'ObjectExpression'(node) {
      const keyProperty = getProperty(node, 'key')
      const nsProperty = getProperty(node, 'ns')
      if (!keyProperty || !nsProperty) return
      const namespace = resolveNamespace(nsProperty.value)
      readNamespace(nsProperty.value, namespace)
      readKeys(node, namespace, keyProperty.value, undefined, optionsAllowVariants(node))
    },

    'Program:exit'() {
      const boundNames = new Set(bindings.map((binding) => binding.name))
      for (const {node, name, keyNode, nsOverride, allowsVariants} of keyReads) {
        const binding = boundNames.has(name) ? findBinding(node, name) : null
        if (!binding) continue
        if (nsOverride) {
          const namespace = resolveNamespace(nsOverride)
          readNamespace(nsOverride, namespace)
          readKeys(node, namespace, keyNode, binding.keyPrefix, allowsVariants)
        } else {
          readKeys(node, binding.namespace, keyNode, binding.keyPrefix, allowsVariants)
        }
      }
    },
  }
}

/** The file being linted, relative to the configured root, with forward slashes */
export function relativeFilename(context) {
  const {rootDir} = getConfig(context.options[0])
  return path.relative(rootDir, context.filename).split(path.sep).join('/')
}

/**
 * The resource files a key read in `filename` must exist in: the one owned by the directory
 * the file lives in, if any (comments v1 vs v2), otherwise every resource of the namespace.
 */
export function resourcesFor(entry, filename) {
  const own = entry.resources.filter(
    (resource) => resource.home && filename.startsWith(resource.home),
  )
  return own.length > 0 ? own : entry.resources
}

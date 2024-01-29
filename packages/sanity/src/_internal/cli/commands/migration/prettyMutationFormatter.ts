import {isatty} from 'tty'
import {Migration, Mutation, NodePatch, NodePatchList} from '@sanity/migrate'
import {KeyedSegment} from '@sanity/types'
import {Chalk} from 'chalk'
import {pathToString} from 'sanity'

type ItemRef = string | number
type Impact = 'destructive' | 'maybeDestructive' | 'incremental'
type Variant = Impact | 'info'

const isTty = isatty(1)

interface FormatterOptions {
  chalk: Chalk
  mutations: Mutation[]
  migration: Migration
}

export function prettyFormat({chalk, mutations, migration}: FormatterOptions): string {
  return `${[...mutations].flatMap((m) => prettyFormatMutation(chalk, m, migration)).join('\n')}`
}

function encodeItemRef(ref: number | KeyedSegment): ItemRef {
  return typeof ref === 'number' ? ref : ref._key
}

function badgeStyle(chalk: Chalk, variant: Variant): Chalk {
  const styles: Record<Variant, Chalk> = {
    info: chalk.bgWhite.black,
    incremental: chalk.bgGreen.black.bold,
    maybeDestructive: chalk.bgYellow.black.bold,
    destructive: chalk.bgRed.black.bold,
  }

  return styles[variant]
}

function badge(label: string, variant: Variant, chalk: Chalk): string {
  if (!isTty) {
    return `[${label}]`
  }

  return badgeStyle(chalk, variant)(` ${label} `)
}

const mutationImpact: Record<Mutation['type'], Impact> = {
  create: 'incremental',
  createIfNotExists: 'incremental',
  createOrReplace: 'maybeDestructive',
  delete: 'destructive',
  patch: 'maybeDestructive',
}

function documentId(mutation: Mutation): string | undefined {
  if ('id' in mutation) {
    return mutation.id
  }

  if ('document' in mutation) {
    return mutation.document._id
  }

  return undefined
}

const listFormatter = new Intl.ListFormat('en-US', {
  type: 'disjunction',
})

function mutationHeader(chalk: Chalk, mutation: Mutation, migration: Migration): string {
  const mutationType = badge(mutation.type, mutationImpact[mutation.type], chalk)

  const documentType =
    'document' in mutation || migration.documentTypes
      ? badge(
          'document' in mutation
            ? mutation.document._type
            : listFormatter.format(migration.documentTypes ?? []),
          'info',
          chalk,
        )
      : null

  // TODO: Should we list documentType when a mutation can be yielded for any document type?
  return [mutationType, documentType, documentId(mutation)].filter(Boolean).join(' ')
}

export function prettyFormatMutation(
  chalk: Chalk,
  mutation: Mutation,
  migration: Migration,
  indentSize = 0,
): string {
  const lock =
    'options' in mutation ? chalk.cyan(`(if revision==${mutation.options?.ifRevision})`) : ''
  const header = [mutationHeader(chalk, mutation, migration), lock].join(' ')
  const indent = ' '.repeat(indentSize)

  if (
    mutation.type === 'create' ||
    mutation.type === 'createIfNotExists' ||
    mutation.type === 'createOrReplace'
  ) {
    return [
      header,
      '\n',
      JSON.stringify(mutation.document, null, 2)
        .split('\n')
        .map((line) => indent + line)
        .join('\n'),
    ].join('')
  }

  if (mutation.type === 'patch') {
    const tree = convertToTree(mutation.patches)
    const paddingLength = Math.max(maxKeyLength(tree.children) + 2, 30)
    return [
      header,
      '\n',
      formatTree(tree.children, paddingLength, indent, (patch) =>
        formatPatchMutation(chalk, patch),
      ),
    ].join('')
  }

  return header
}

function formatPatchMutation(chalk: Chalk, patch: NodePatch): string {
  const {op} = patch
  const formattedType = chalk.bold(op.type)
  if (op.type === 'unset') {
    return `${chalk.red(formattedType)}()`
  }
  if (op.type === 'diffMatchPatch') {
    return `${chalk.yellow(formattedType)}(${op.value})`
  }
  if (op.type === 'inc' || op.type === 'dec') {
    return `${chalk.yellow(formattedType)}(${op.amount})`
  }
  if (op.type === 'set') {
    return `${chalk.yellow(formattedType)}(${JSON.stringify(op.value)})`
  }
  if (op.type === 'setIfMissing') {
    return `${chalk.green(formattedType)}(${JSON.stringify(op.value)})`
  }
  if (op.type === 'assign') {
    return `${chalk.yellow(formattedType)}(${JSON.stringify(op.value)})`
  }
  if (op.type === 'unassign') {
    return `${chalk.red(formattedType)}(${JSON.stringify(op.keys)})`
  }
  if (op.type === 'insert') {
    return `${chalk.green(formattedType)}(${op.position}, ${encodeItemRef(
      op.referenceItem,
    )}, ${JSON.stringify(op.items)})`
  }
  if (op.type === 'upsert') {
    return `${chalk.yellow(formattedType)}(${op.position}, ${encodeItemRef(
      op.referenceItem,
    )}, ${JSON.stringify(op.items)})`
  }
  if (op.type === 'replace') {
    return `${chalk.yellow(formattedType)}(${encodeItemRef(op.referenceItem)}, ${JSON.stringify(
      op.items,
    )})`
  }
  if (op.type === 'truncate') {
    return `${chalk.red(formattedType)}(${op.startIndex}, ${op.endIndex})`
  }
  // @ts-expect-error all cases are covered
  throw new Error(`Invalid operation type: ${op.type}`)
}

interface PatchTree {
  patches?: Extract<NodePatchList, [NodePatch, ...NodePatch[]] | NodePatch[]>
  children?: Record<string, PatchTree>
}

/**
 * Converts a set of markers with paths into a tree of markers where the paths
 * are embedded in the tree
 */
function convertToTree(patches: NodePatchList): PatchTree {
  const root: PatchTree = {}

  // add the markers to the tree
  function addPatch(patch: NodePatch, node: PatchTree = root) {
    // if we've traversed the whole path
    if (!patch.path.length) {
      if (!node.patches) node.patches = [] // ensure markers is defined

      // then add the marker to the front
      node.patches.push(patch)
      return
    }

    const [current, ...rest] = patch.path
    const key = pathToString([current])

    // ensure the current node has children and the next node
    if (!node.children) node.children = {}
    if (!(key in node.children)) node.children[key] = {}

    addPatch({...patch, path: rest}, node.children[key])
  }

  for (const patch of patches.flat()) addPatch(patch)
  return root
}

/**
 * Recursively formats a given tree into a printed user-friendly tree structure
 *
 * TODO: Handle multiline output.
 */
function formatTree(
  node: Record<string, PatchTree> = {},
  paddingLength: number,
  indent = '',
  formatPatch: (patch: NodePatch) => string = (patch) => patch.op.type,
): string {
  const entries = Object.entries(node)

  return entries
    .map(([key, child], index) => {
      const isLast = index === entries.length - 1
      const nextIndent = `${indent}${isLast ? '  ' : '│ '}`
      const nested = formatTree(child.children, paddingLength, nextIndent, formatPatch)

      if (!child.patches?.length) {
        const current = `${indent}${isLast ? '└' : '├'}─ ${key}`
        return [current, nested].filter(Boolean).join('\n')
      }

      const [first, ...rest] = child.patches
      const firstPadding = '.'.repeat(paddingLength - indent.length - key.length)
      const elbow = isLast ? '└' : '├'
      const subsequentPadding = ' '.repeat(paddingLength - indent.length + 2)

      const firstMessage = `${indent}${elbow}─ ${key} ${firstPadding} ${formatPatch(first)}`
      const subsequentMessages = rest
        .map((patch) => `${nextIndent}${subsequentPadding} ${formatPatch(patch)}`)
        .join('\n')

      const current = [firstMessage, subsequentMessages].filter(Boolean).join('\n')
      return [current, nested].filter(Boolean).join('\n')
    })
    .join('\n')
}

/**
 * Recursively calculates the max length of all the keys in the given validation
 * tree respecting extra length due to indentation depth. Used to calculate the
 * padding for the rest of the tree.
 */
const maxKeyLength = (children: Record<string, PatchTree> = {}, depth = 0): number => {
  return Object.entries(children)
    .map(([key, child]) =>
      Math.max(key.length + depth * 2, maxKeyLength(child.children, depth + 1)),
    )
    .reduce((max, next) => (next > max ? next : max), 0)
}

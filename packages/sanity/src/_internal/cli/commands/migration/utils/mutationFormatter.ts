// An example of a compact formatter

import type {Mutation, NodePatch, Transaction} from '@sanity/migrate'

import type {Chalk} from 'chalk'
import type {KeyedSegment} from '@sanity/types'
import {toString as pathToString} from '@sanity/util/paths'

export type ItemRef = string | number

export function format(chalk: Chalk, mutations: Mutation[]): string {
  return mutations.flatMap((m) => formatTransaction(chalk, m)).join('\n')
}

function encodeItemRef(ref: number | KeyedSegment): ItemRef {
  return typeof ref === 'number' ? ref : ref._key
}

export function formatTransaction(chalk: Chalk, mutation: Mutation | Transaction): string {
  if (mutation.type === 'transaction') {
    return mutation.mutations.flatMap((m) => formatTransaction(chalk, m)).join('\n')
  }
  if (
    mutation.type === 'create' ||
    mutation.type === 'createIfNotExists' ||
    mutation.type === 'createOrReplace'
  ) {
    return [chalk.bold(mutation.type), ': ', JSON.stringify(mutation.document)].join('')
  }
  if (mutation.type === 'delete') {
    return [`${chalk.red.bold('delete')} `, mutation.id].join(': ')
  }
  if (mutation.type === 'patch') {
    const ifRevision = mutation.options?.ifRevision
    return [
      chalk.blue.bold('patch'),
      '',
      `(${mutation.id})`,
      ifRevision ? ` (if revision==${ifRevision})` : '',
      ':\n',
      mutation.patches.map((nodePatch) => `  ${formatPatchMutation(chalk, nodePatch)}`).join('\n'),
    ].join('')
  }

  //@ts-expect-error - all cases are covered
  throw new Error(`Invalid mutation type: ${mutation.type}`)
}

function formatPatchMutation(chalk: Chalk, patch: NodePatch<any>): string {
  const {op} = patch
  const path = chalk.grey(pathToString(patch.path))
  const formattedType = chalk.bold(op.type)
  if (op.type === 'unset') {
    return [path, `${formattedType}()`].join(': ')
  }
  if (op.type === 'diffMatchPatch') {
    return [path, `${formattedType}(${op.value})`].join(': ')
  }
  if (op.type === 'inc' || op.type === 'dec') {
    return [path, `${formattedType}(${op.amount})`].join(': ')
  }
  if (op.type === 'set' || op.type === 'setIfMissing') {
    return [path, `${formattedType}(${JSON.stringify(op.value)})`].join(': ')
  }
  if (op.type === 'assign') {
    return [path, `${formattedType}(${JSON.stringify(op.value)})`].join(': ')
  }
  if (op.type === 'unassign') {
    return [path, `${formattedType}(${JSON.stringify(op.keys)})`].join(': ')
  }
  if (op.type === 'insert' || op.type === 'upsert') {
    return [
      path,
      `${formattedType}(${op.position}, ${encodeItemRef(op.referenceItem)}, ${JSON.stringify(
        op.items,
      )})`,
    ].join(': ')
  }
  if (op.type === 'replace') {
    return [
      path,
      `${formattedType}(${encodeItemRef(op.referenceItem)}, ${JSON.stringify(op.items)})`,
    ].join(': ')
  }
  if (op.type === 'truncate') {
    return [path, `${formattedType}(${op.startIndex}, ${op.endIndex})`].join(': ')
  }
  // @ts-expect-error all cases are covered
  throw new Error(`Invalid operation type: ${op.type}`)
}

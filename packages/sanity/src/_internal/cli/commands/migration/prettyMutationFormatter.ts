import {isatty} from 'node:tty'

import {type Migration, type Mutation, type NodePatch, type Transaction} from '@sanity/migrate'
import {type KeyedSegment} from '@sanity/types'
import {type Chalk} from 'chalk'

import {convertToTree, formatTree, maxKeyLength} from '../../util/tree'

type ItemRef = string | number
type Impact = 'destructive' | 'maybeDestructive' | 'incremental'
type Variant = Impact | 'info'

const isTty = isatty(1)

interface FormatterOptions<Subject> {
  chalk: Chalk
  subject: Subject
  migration: Migration
  indentSize?: number
}

export function prettyFormat({
  chalk,
  subject,
  migration,
  indentSize = 0,
}: FormatterOptions<Mutation | Transaction | (Mutation | Transaction)[]>): string {
  return (Array.isArray(subject) ? subject : [subject])
    .map((subjectEntry) => {
      if (subjectEntry.type === 'transaction') {
        return [
          [
            badge('transaction', 'info', chalk),
            typeof subjectEntry.id === 'undefined' ? null : chalk.underline(subjectEntry.id),
          ]
            .filter(Boolean)
            .join(' '),
          indent(
            prettyFormat({
              chalk,
              subject: subjectEntry.mutations,
              migration,
              indentSize: indentSize,
            }),
          ),
        ].join('\n\n')
      }
      return prettyFormatMutation({
        chalk,
        subject: subjectEntry,
        migration,
        indentSize,
      })
    })
    .join('\n\n')
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
  return [mutationType, documentType, chalk.underline(documentId(mutation))]
    .filter(Boolean)
    .join(' ')
}

export function prettyFormatMutation({
  chalk,
  subject,
  migration,
  indentSize = 0,
}: FormatterOptions<Mutation>): string {
  const lock =
    'options' in subject ? chalk.cyan(`(if revision==${subject.options?.ifRevision})`) : ''
  const header = [mutationHeader(chalk, subject, migration), lock].join(' ')
  const padding = ' '.repeat(indentSize)

  if (
    subject.type === 'create' ||
    subject.type === 'createIfNotExists' ||
    subject.type === 'createOrReplace'
  ) {
    return [header, '\n', indent(JSON.stringify(subject.document, null, 2), indentSize)].join('')
  }

  if (subject.type === 'patch') {
    const tree = convertToTree<NodePatch>(subject.patches.flat())
    const paddingLength = Math.max(maxKeyLength(tree.children) + 2, 30)

    return [
      header,
      '\n',
      formatTree<NodePatch>({
        node: tree.children,
        paddingLength,
        indent: padding,
        getMessage: (patch) => formatPatchMutation(chalk, patch),
      }),
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
  if (op.type === 'insert') {
    return `${chalk.green(formattedType)}(${op.position}, ${encodeItemRef(
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

function indent(subject: string, size = 2): string {
  const padding = ' '.repeat(size)

  return subject
    .split('\n')
    .map((line) => padding + line)
    .join('\n')
}

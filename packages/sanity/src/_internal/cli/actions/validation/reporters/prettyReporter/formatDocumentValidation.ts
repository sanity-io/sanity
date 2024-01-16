import chalk from 'chalk'
import {ValidationMarker} from '@sanity/types'
import logSymbols from 'log-symbols'
import {DocumentValidationResult, Level, isTty, levelValues} from './util'
import {pathToString} from 'sanity'

export interface FormatDocumentValidationOptions extends DocumentValidationResult {
  studioHost: string | null
  basePath: string
}

interface ValidationTree {
  markers?: Pick<ValidationMarker, 'level' | 'message'>[]
  children?: Record<string, ValidationTree>
}

const levelHeaders = {
  error: isTty ? chalk.bold(chalk.bgRed(' ERROR ')) : chalk.red('[ERROR]'),
  warning: isTty ? chalk.bold(chalk.bgYellow(' WARN ')) : chalk.yellow('[WARN]'),
  info: isTty ? chalk.bold(chalk.cyan(' INFO ')) : chalk.cyan('[INFO]'),
}
/**
 * Creates a terminal hyperlink. Only outputs a hyperlink if the output is
 * determined to be a TTY
 */
const link = (text: string, url: string) =>
  isTty ? `\u001b]8;;${url}\u0007${text}\u001b]8;;\u0007` : chalk.underline(text)

/**
 * Recursively calculates the max length of all the keys in the given validation
 * tree respecting extra length due to indentation depth. Used to calculate the
 * padding for the rest of the tree.
 */
const maxKeyLength = (children: Record<string, ValidationTree> = {}, depth = 0): number => {
  return Object.entries(children)
    .map(([key, child]) =>
      Math.max(key.length + depth * 2, maxKeyLength(child.children, depth + 1)),
    )
    .reduce((max, next) => (next > max ? next : max), 0)
}

/**
 * For sorting markers
 */
const compareLevels = <T extends {level: Level; message: string}>(a: T, b: T) =>
  levelValues[a.level] - levelValues[b.level]

/**
 * Recursively formats a given tree into a printed user-friendly tree structure
 */
const formatTree = (
  node: Record<string, ValidationTree> = {},
  paddingLength: number,
  indent = '',
): string => {
  const entries = Object.entries(node)

  return entries
    .map(([key, child], index) => {
      const isLast = index === entries.length - 1
      const nextIndent = `${indent}${isLast ? '  ' : '│ '}`
      const nested = formatTree(child.children, paddingLength, nextIndent)

      if (!child.markers?.length) {
        const current = `${indent}${isLast ? '└' : '├'}─ ${key}`
        return [current, nested].filter(Boolean).join('\n')
      }

      const [first, ...rest] = child.markers.slice().sort(compareLevels)
      const firstPadding = '.'.repeat(paddingLength - indent.length - key.length)
      const elbow = isLast ? '└' : '├'
      const firstBullet = logSymbols[first.level]
      const subsequentPadding = ' '.repeat(paddingLength - indent.length + 2)

      const firstMessage = `${indent}${elbow}─ ${key} ${firstPadding} ${firstBullet} ${first.message}`
      const subsequentMessages = rest
        .map(
          (marker) =>
            `${nextIndent}${subsequentPadding} ${logSymbols[marker.level]} ${marker.message}`,
        )
        .join('\n')

      const current = [firstMessage, subsequentMessages].filter(Boolean).join('\n')
      return [current, nested].filter(Boolean).join('\n')
    })
    .join('\n')
}

/**
 * Formats the markers at the root of the validation tree
 */
const formatRootErrors = (root: ValidationTree, hasChildren: boolean, paddingLength: number) => {
  if (!root.markers) return ''

  const [first, ...rest] = root.markers.slice().sort(compareLevels)
  if (!first) return ''

  const firstElbow = hasChildren ? '│ ' : '└─'
  const firstPadding = '.'.repeat(paddingLength - 6)
  const firstLine = `${firstElbow} (root) ${firstPadding} ${logSymbols[first.level]} ${
    first.message
  }`
  const subsequentPadding = ' '.repeat(paddingLength + 2)
  const subsequentElbow = hasChildren ? '│ ' : '  '

  const restOfLines = rest
    .map(
      (marker) =>
        `${subsequentElbow}${subsequentPadding} ${logSymbols[marker.level]} ${marker.message}`,
    )
    .join('\n')
  return [firstLine, restOfLines].filter(Boolean).join('\n')
}

/**
 * Converts a set of markers with paths into a tree of markers where the paths
 * are embedded in the tree
 */
function convertToTree(markers: ValidationMarker[]): ValidationTree {
  const root: ValidationTree = {}

  // add the markers to the tree
  function addMarker(marker: ValidationMarker, node: ValidationTree = root) {
    // if we've traversed the whole path
    if (!marker.path.length) {
      if (!node.markers) node.markers = [] // ensure markers is defined

      // then add the marker to the front
      node.markers.push({level: marker.level, message: marker.message})
      return
    }

    const [current, ...rest] = marker.path
    const key = pathToString([current])

    // ensure the current node has children and the next node
    if (!node.children) node.children = {}
    if (!(key in node.children)) node.children[key] = {}

    addMarker({...marker, path: rest}, node.children[key])
  }

  for (const marker of markers) addMarker(marker)
  return root
}

/**
 * Formats document validation results into a user-friendly tree structure
 */
export function formatDocumentValidation({
  basePath,
  documentId,
  documentType,
  level,
  studioHost,
  markers,
}: FormatDocumentValidationOptions): string {
  const tree = convertToTree(markers)
  const editLink =
    studioHost &&
    `${studioHost}${basePath}/intent/edit/id=${encodeURIComponent(
      documentId,
    )};type=${encodeURIComponent(documentType)}`

  const documentTypeHeader = isTty ? chalk.bgWhite(` ${documentType} `) : `[${documentType}]`

  const header = `${levelHeaders[level]} ${documentTypeHeader} ${
    editLink ? link(documentId, editLink) : chalk.underline(documentId)
  }`

  const paddingLength = Math.max(maxKeyLength(tree.children) + 2, 30)
  const childErrors = formatTree(tree.children, paddingLength)
  const rootErrors = formatRootErrors(tree, childErrors.length > 0, paddingLength)

  return [header, rootErrors, childErrors].filter(Boolean).join('\n')
}

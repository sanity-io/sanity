#!/usr/bin/env node
/**
 * Format existing local screenshots or recordings for a GitHub PR body.
 * Browser operation belongs to agent-browser; this script only owns the
 * deterministic attachment markup and marker replacement contract.
 */

import {existsSync, readFileSync} from 'node:fs'
import {extname, relative, resolve} from 'node:path'
import {parseArgs} from 'node:util'

export const MARKER_START = '<!-- before-and-after:start -->'
export const MARKER_END = '<!-- before-and-after:end -->'

const IMAGE_EXTENSIONS = new Set(['.gif', '.jpeg', '.jpg', '.png', '.webp'])
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.webm'])

export function mediaKind(file) {
  const extension = extname(file).toLowerCase()
  if (IMAGE_EXTENSIONS.has(extension)) return 'image'
  if (VIDEO_EXTENSIONS.has(extension)) return 'video'
  throw new Error(`Unsupported media file "${file}"`)
}

export function localRef(file, cwd = process.cwd()) {
  const path = relative(cwd, resolve(cwd, file))
  if (path === '..' || path.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)) {
    throw new Error(`Media files must be inside the working directory: "${file}"`)
  }
  const ref = path.startsWith('.') ? path : `./${path}`
  if (/\s/.test(ref)) throw new Error(`Media paths cannot contain whitespace: "${ref}"`)
  return ref
}

export function buildPairs({before = [], after = [], labels = []}) {
  if (after.length === 0) throw new Error('At least one --after file is required')
  if (before.length !== 0 && before.length !== after.length) {
    throw new Error('Provide either no --before files or one --before file for every --after file')
  }
  if (labels.length > after.length)
    throw new Error('Provide at most one --label for every --after file')

  return after.map((afterFile, index) => ({
    before: before.length ? before[index] : null,
    after: afterFile,
    label: labels[index] ?? null,
  }))
}

function heading(label) {
  return label ? ` (${label})` : ''
}

function imageRef(file, alt, cwd) {
  return `![${alt}](${localRef(file, cwd)})`
}

function githubAttachmentUrl(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error(`Invalid GitHub attachment URL: "${value}"`)
  }
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'github.com' ||
    !url.pathname.startsWith('/user-attachments/assets/')
  ) {
    throw new Error(`Expected a https://github.com/user-attachments/assets/... URL: "${value}"`)
  }
  return url.href
}

function renderImagePair(pair, cwd, lines) {
  const suffix = heading(pair.label)
  if (pair.before) {
    lines.push(
      `| Before${suffix} | After${suffix} |`,
      '|:---:|:---:|',
      `| ${imageRef(pair.before, 'Before', cwd)} | ${imageRef(pair.after, 'After', cwd)} |`,
      '',
    )
  } else {
    lines.push(`| Preview${suffix} |`, '|:---:|', `| ${imageRef(pair.after, 'Preview', cwd)} |`, '')
  }
}

function renderVideoPair(pair, cwd, lines) {
  const suffix = heading(pair.label)
  if (pair.before) {
    lines.push(`**Before${suffix}**`, '', imageRef(pair.before, 'Before', cwd), '')
  }
  lines.push(
    `**${pair.before ? 'After' : 'Preview'}${suffix}**`,
    '',
    imageRef(pair.after, pair.before ? 'After' : 'Preview', cwd),
    '',
  )
}

function renderVideoTablePair(pair, lines) {
  const suffix = heading(pair.label)
  const beforeUrl = pair.before ? githubAttachmentUrl(pair.before) : null
  const afterUrl = githubAttachmentUrl(pair.after)
  lines.push('<table>', '  <tr>')
  if (beforeUrl) lines.push(`    <th>Before${suffix}</th>`)
  lines.push(`    <th>${beforeUrl ? 'After' : 'Preview'}${suffix}</th>`, '  </tr>', '  <tr>')
  if (beforeUrl) lines.push(`    <td><video src="${beforeUrl}" width="100%" controls></video></td>`)
  lines.push(
    `    <td><video src="${afterUrl}" width="100%" controls></video></td>`,
    '  </tr>',
    '</table>',
    '',
  )
}

export function formatMarkdown(pairs, {attribution, cwd = process.cwd()} = {}) {
  const lines = [MARKER_START]
  if (attribution) lines.push(`> Before/after by ${attribution}`, '')

  for (const pair of pairs) {
    const beforeKind = pair.before ? mediaKind(pair.before) : null
    const afterKind = mediaKind(pair.after)
    if (beforeKind && beforeKind !== afterKind) {
      throw new Error(
        `Before and after must use the same media type: "${pair.before}" and "${pair.after}"`,
      )
    }
    if (afterKind === 'image') renderImagePair(pair, cwd, lines)
    else renderVideoPair(pair, cwd, lines)
  }

  lines.push(MARKER_END)
  return `${lines.join('\n').trim()}\n`
}

export function formatVideoTables(pairs, {attribution} = {}) {
  const lines = [MARKER_START]
  if (attribution) lines.push(`> Before/after by ${attribution}`, '')
  for (const pair of pairs) renderVideoTablePair(pair, lines)
  lines.push(MARKER_END)
  return `${lines.join('\n').trim()}\n`
}

export function attachList(pairs, {cwd = process.cwd()} = {}) {
  return [
    ...new Set(
      pairs
        .flatMap((pair) => [pair.before, pair.after])
        .filter(Boolean)
        .map((file) => localRef(file, cwd)),
    ),
  ]
}

export function replaceMarkedBlock(body, block) {
  const start = body.indexOf(MARKER_START)
  const end = body.indexOf(MARKER_END)

  if (start === -1 && end === -1) {
    const prefix = body.trimEnd()
    return prefix ? `${prefix}\n\n${block}` : block
  }
  if (start === -1 || end === -1 || end < start) {
    throw new Error('PR body contains an incomplete before-and-after marker block')
  }
  if (
    body.indexOf(MARKER_START, start + MARKER_START.length) !== -1 ||
    body.indexOf(MARKER_END, end + MARKER_END.length) !== -1
  ) {
    throw new Error('PR body contains multiple before-and-after marker blocks')
  }

  const afterEnd = end + MARKER_END.length
  const prefix = body.slice(0, start).trimEnd()
  const suffix = body.slice(afterEnd).trim()
  return [prefix, block.trim(), suffix].filter(Boolean).join('\n\n') + '\n'
}

function validateFiles(pairs, cwd) {
  for (const file of pairs.flatMap((pair) => [pair.before, pair.after]).filter(Boolean)) {
    const absolute = resolve(cwd, file)
    if (!existsSync(absolute)) throw new Error(`Media file does not exist: "${file}"`)
    mediaKind(file)
    localRef(file, cwd)
  }
}

function main(argv) {
  const {values} = parseArgs({
    args: argv,
    options: {
      'before': {type: 'string', multiple: true},
      'after': {type: 'string', multiple: true},
      'label': {type: 'string', multiple: true},
      'attribution': {type: 'string'},
      'attach-list': {type: 'boolean'},
      'body-file': {type: 'string'},
      'before-video-url': {type: 'string', multiple: true},
      'after-video-url': {type: 'string', multiple: true},
    },
  })

  const localMode = (values.after?.length ?? 0) > 0 || (values.before?.length ?? 0) > 0
  const videoTableMode =
    (values['after-video-url']?.length ?? 0) > 0 || (values['before-video-url']?.length ?? 0) > 0
  if (localMode === videoTableMode) {
    throw new Error(
      'Provide local --after files or final --after-video-url attachments, but not both',
    )
  }

  const pairs = videoTableMode
    ? buildPairs({
        before: values['before-video-url'],
        after: values['after-video-url'],
        labels: values.label,
      })
    : buildPairs({before: values.before, after: values.after, labels: values.label})
  if (!videoTableMode) validateFiles(pairs, process.cwd())

  if (values['attach-list']) {
    if (videoTableMode) throw new Error('--attach-list requires local media files')
    process.stdout.write(`${attachList(pairs).join('\n')}\n`)
    return
  }

  const block = videoTableMode
    ? formatVideoTables(pairs, {attribution: values.attribution})
    : formatMarkdown(pairs, {attribution: values.attribution})
  if (values['body-file']) {
    process.stdout.write(replaceMarkedBlock(readFileSync(values['body-file'], 'utf-8'), block))
  } else {
    process.stdout.write(block)
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').at(-1))) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    console.error(String(error?.message ?? error))
    process.exit(1)
  }
}

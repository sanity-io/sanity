import {execFile, execFileSync} from 'node:child_process'
import {promisify} from 'node:util'

import partition from 'lodash-es/partition.js'
import uniq from 'lodash-es/uniq.js'

const execFileAsync = promisify(execFile)

const placeholders = {
  commit: '%H',
  abbreviatedCommit: '%h',
  tree: '%T',
  abbreviatedTree: '%t',
  parent: '%P',
  abbreviatedParent: '%p',
  refs: '%D',
  encoding: '%e',
  subject: '%s',
  sanitizedSubjectLine: '%f',
  body: '%b',
  commitNotes: '%N',
  verificationFlag: '%G?',
  signer: '%GS',
  signerKey: '%GK',
  authorName: '%aN',
  authorEmail: '%aE',
  authorDate: '%aI',
  committerName: '%cN',
  committerEmail: '%cE',
  committerDate: '%cI',
  currentTag: '%(describe:tags,abbrev=0)',
  tag: '%(describe:tags)',
}

type GitField = keyof typeof placeholders

export const ALL_FIELDS = Object.keys(placeholders) as GitField[]

const DELIMITER_PLACEHOLDER = '%x00'
const DELIMITER_OUTPUT = '\x00'

/**
 * Parse ref names (i.e. the output of the %D placeholder)
 * @see https://git-scm.com/docs/pretty-formats#Documentation/pretty-formats.txt-emDem
 */
const TAG_PREFIX = 'tag: '
function stripHead(refs: string) {
  return refs.replace(/HEAD,?\s?(->)?\s+/, '')
}

const ORIGIN_PREFIX = 'origin/'
function stripOrigin(branchName: string) {
  return branchName.startsWith(ORIGIN_PREFIX) ? branchName.slice(ORIGIN_PREFIX.length) : branchName
}
export function parseDecoratedRefs(refs: string) {
  const parsedRefs = stripHead(refs)
    .split(/,\s+/)
    .map((s) => s.trim())
    .filter((s) => s)
    .map((s) =>
      s.startsWith(TAG_PREFIX)
        ? {type: 'tag', name: s.slice(TAG_PREFIX.length)}
        : {type: 'branch', name: stripOrigin(s)},
    )
  const [branches, tags] = partition(parsedRefs, (ref) => ref.type === 'branch')
  return {
    branches: uniq(branches.map((b) => b.name)),
    tags: uniq(tags.map((t) => t.name)),
  }
}

function parseOutput<Field extends GitField>(fields: Field[], output: string) {
  const parts = output.split(DELIMITER_OUTPUT)
  return Object.fromEntries(fields.map((fieldName, i) => [fieldName, parts[i]])) as {
    [K in Field]: string
  }
}

function createFormat(fields: GitField[]) {
  return fields.map((fieldName) => placeholders[fieldName]).join(DELIMITER_PLACEHOLDER)
}
function getGitArgs(format: string) {
  return [`log`, `--pretty=format:${format}`, '-1']
}

export async function getGitInfo<Field extends GitField>(
  fields: Field[],
): Promise<{[K in Field]: string}> {
  const output = await execFileAsync('git', getGitArgs(createFormat(fields)))
  return parseOutput(fields, output.stdout)
}

export function getGitInfoSync(fields: GitField[]) {
  const stdout = execFileSync('git', getGitArgs(createFormat(fields)), {encoding: 'utf-8'})
  return parseOutput(fields, stdout)
}

const CURRENT_BRANCH_ARGS = ['rev-parse', '--abbrev-ref', 'HEAD']

export function getCurrentBranch() {
  return execFileAsync('git', CURRENT_BRANCH_ARGS).then((res) => res.stdout)
}

export function getCurrentBranchSync() {
  return execFileSync('git', CURRENT_BRANCH_ARGS, {encoding: 'utf-8'})
}

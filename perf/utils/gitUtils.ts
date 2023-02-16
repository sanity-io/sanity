import execa from 'execa'

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
  latestOfficialTag: '%(describe:tags,abbrev=0)',
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
export function parseDecoratedRefs(refs) {
  return refs.split('->').map((s) => s.trim())
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
  fields: Field[]
): Promise<{[K in Field]: string}> {
  const output = execa('git', getGitArgs(createFormat(fields)))
  return parseOutput(fields, (await output).stdout)
}

export function getGitInfoSync(fields: GitField[]) {
  const res = execa.sync('git', getGitArgs(createFormat(fields)))
  return parseOutput(fields, res.stdout)
}

const CURRENT_BRANCH_ARGS = ['rev-parse', '--abbrev-ref', 'HEAD']

export function getCurrentBranch() {
  return execa('git', CURRENT_BRANCH_ARGS).then((res) => res.stdout)
}

export function getCurrentBranchSync() {
  return execa.sync('git', CURRENT_BRANCH_ARGS).stdout
}

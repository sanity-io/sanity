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
  authorDate: '%aD',
  committerName: '%cN',
  committerEmail: '%cE',
  committerDate: '%cD',
}

type GitField = keyof typeof placeholders

export const ALL = Object.keys(placeholders) as GitField[]

const DELIMITER = '%x00'
const DELIMITER_CHAR = '\x00'

function createOutputParser<Field extends GitField>(fields: Field[]) {
  return (output: string) => {
    const parts = output.split(DELIMITER_CHAR)
    return Object.fromEntries(fields.map((fieldName, i) => [fieldName, parts[i]])) as {
      [K in Field]: string
    }
  }
}

function createFormat(fields: (keyof typeof placeholders)[]) {
  return fields.map((fieldName) => placeholders[fieldName]).join(DELIMITER)
}
function getGitArgs(format: string) {
  return [`log`, `--pretty=format:'${format}'`, '-1']
}

export function getGitInfo<Field extends GitField>(
  fields: Field[]
): Promise<{[K in Field]: string}> {
  return execa('git', getGitArgs(createFormat(fields)))
    .then((res) => res.stdout)
    .then(createOutputParser(fields))
}

export function getGitInfoSync(fields: (keyof typeof placeholders)[]) {
  const parseOutput = createOutputParser(fields)
  console.log(getGitArgs(createFormat(fields)))
  return parseOutput(execa.sync('git', getGitArgs(createFormat(fields))).stdout)
}

export function getCurrentBranch() {
  return execa('git', ['rev-parse', '--abbrev-ref HEAD']).then((res) => res.stdout)
}

export function getCurrentBranchSync() {
  return execa.sync('git', ['rev-parse', '--abbrev-ref HEAD']).stdout
}

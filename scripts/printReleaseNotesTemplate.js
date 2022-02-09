const prettier = require('prettier')
const fetch = require('node-fetch')
const {JSDOM} = require('jsdom')
const execa = require('execa')
const {groupBy} = require('lodash')
const {oneLine, stripIndents, stripIndent} = require('common-tags')

const COMMITS_COMMAND =
  'git log --pretty=format:%h --abbrev-commit --reverse $(git describe --abbrev=0)..origin/next'
const CHANGELOG_COMMAND =
  "git log --pretty=format:'%aN | %s | %h' --abbrev-commit --reverse $(git describe --abbrev=0)..origin/next"

/**
 * Downloads the PR from a github API proxy
 * @param {number} prNumber
 */
async function downloadPr(prNumber) {
  // A simple wrapper API that holds a personal access token safe.
  // https://github.com/ricokahler/get-pr-from-github/blob/51ef5ffba954dd5ada8eea116eba1ef693ba274b/api/pulls/%5Bpr%5D.js#L17
  const response = await fetch(`https://get-pr-from-github.vercel.app/api/pulls/${prNumber}`)
  if (!response.ok) {
    throw new Error(`Failed to get PRs from GitHub. ${await response.text()}`)
  }

  return response.json()
}

/**
 * Gets the related PRs from a commit hash via github `branch_commits`.
 */
async function getPrsFromCommit(commit) {
  // afaik, this endpoint is not in the github REST API but it's exactly what we need
  const response = await fetch(`https://github.com/sanity-io/sanity/branch_commits/${commit}`)
  if (!response.ok) {
    throw new Error(`Failed to get PR numbers from GitHub. ${await response.text()}`)
  }

  const html = await response.text()
  const {document} = new JSDOM(html).window
  const anchors = Array.from(document.querySelectorAll('.branches-list .pull-request a'))

  return anchors.map((anchor) => parseInt(anchor.textContent.trim().substring(1), 10))
}

/**
 * Given a PR body (as markdown), does some simple parsing to extract the type
 * of release note and the note portion of the PR
 *
 * @param {string | undefined} body
 * @returns {null | {releaseType: string; releaseNote: string}}
 */
function parsePrBody(body) {
  if (!body) return null

  const split = body.split('Type of release:')[1]
  if (!split) return null

  const [releaseTypePart, releaseNotesPart] = split.split('-- START RELEASE NOTES --')
  if (!releaseNotesPart) return null

  let releaseType
  if (releaseTypePart.toLowerCase().includes('highlighted feature section')) {
    releaseType = 'featuresHighlighted'
  } else if (releaseTypePart.toLowerCase().includes('highlighted bugfix section')) {
    releaseType = 'bugfixesHighlighted'
  } else if (releaseTypePart.toLowerCase().includes('one-line feature note')) {
    releaseType = 'featuresOneline'
  } else if (releaseTypePart.toLowerCase().includes('one-line bugfix note')) {
    releaseType = 'bugfixesOneline'
  } else {
    releaseType = 'none'
  }

  let releaseNote = releaseNotesPart.split('\n').slice(1).join('\n').trim()

  if (releaseType === 'featureOneline' || releaseType === 'bugfixOneline') {
    releaseNote = oneLine(releaseNote)
  }

  return {releaseType, releaseNote}
}

async function clipboardCopy(data) {
  const proc = require('child_process').spawn('pbcopy')
  proc.stdin.write(data)
  await new Promise((resolve) => proc.stdin.end(resolve))
}

/**
 * Runs each item through the task function sequentially and reports a progress
 * message as it loads.
 */
async function loadSequentially({message, items, task}) {
  const results = []

  let progress = 0

  for (const item of items) {
    results.push(await task(item))
    progress++

    // eslint-disable-next-line no-console
    console.clear()
    // eslint-disable-next-line no-console
    console.log(`${message} ${progress} / ${items.length}`)
  }

  return results
}

async function main() {
  const commits = (await execa.command(COMMITS_COMMAND)).stdout.trim().split('\n').filter(Boolean)

  const prNumbers = Array.from(
    new Set(
      (
        await loadSequentially({
          message: 'Getting PR numbers from commits…',
          items: commits,
          task: getPrsFromCommit,
        })
      ).flat()
    )
  ).sort()

  const prs = await loadSequentially({
    message: 'Downloading PRs',
    items: prNumbers,
    task: downloadPr,
  })

  const parsedPrs = prs
    .map((pr) => ({
      number: pr.number,
      ...parsePrBody(pr.body),
    }))
    .filter((pr) => pr.releaseNote)
    .sort((a, b) => a.number - b.number)

  const {
    featuresHighlighted = [],
    featuresOneline = [],
    bugfixesOneline = [],
    bugfixesHighlighted = [],
  } = groupBy(parsedPrs, (pr) => pr.releaseType)

  const releaseNotes = `
<!--
-------- SANITY RELEASE NOTES TEMPLATE (delete me) --------
Use the following template as a starting point for next release:
A draft can be created here: https://github.com/sanity-io/sanity/releases/new

The following PRs were found from the commits:

${prs.map((pr) => `- https://github.com/sanity-io/sanity/pull/${pr.number}`).join('\n')}

-->

Upgrade the Command Line Interface (CLI) with:

    npm install --global @sanity/cli

Upgrade Sanity Studio with:

    sanity upgrade

${featuresHighlighted.length || featuresOneline.length ? '# ✨ Highlights' : ''}

${featuresHighlighted.map((pr) => pr.releaseNote.trim()).join('\n\n')}

${
  // this line will be omitted if there are no multi-line sections
  featuresHighlighted.length && featuresOneline.length ? '## Other notable features' : ''
}

${featuresOneline.map((pr) => `- ${pr.releaseNote} (#${pr.number})`).join('\n')}

${bugfixesHighlighted.length || bugfixesOneline.length ? '# 🐛 Notable bugfixes' : ''}

${bugfixesHighlighted.map((pr) => pr.releaseNote.trim()).join('\n\n')}

${
  // this line will be omitted if there are no multi-line sections
  featuresHighlighted.length && featuresOneline.length ? '## Other notable bugfixes' : ''
}

${bugfixesOneline.map((pr) => `- ${pr.releaseNote} (#${pr.number})`).join('\n')}

# 📓 Full changelog

Author | Message | Commit
------------ | ------------- | -------------
${execa.commandSync(CHANGELOG_COMMAND, {shell: true}).stdout}
`

  const formattedRelatedNotes = prettier.format(releaseNotes, {parser: 'markdown'})

  // eslint-disable-next-line no-console
  console.info(`${formattedRelatedNotes}\n`)

  // log useful back links
  // eslint-disable-next-line no-console
  console.info(
    `${stripIndents`
      ⚠️ Warning: could not parse the following PR bodies:

      ${prs
        .filter((pr) => !parsedPrs.find((p) => p.number === pr.number))
        .map((pr) => ` - https://github.com/sanity-io/sanity/pull/${pr.number}`)
        .join('\n')}

      ${parsedPrs.length ? 'Found and parsed the following PRs:' : '🔴 No PRs were parsed.'}

      ${parsedPrs
        .map((pr) => {
          return stripIndent`
            - https://github.com/sanity-io/sanity/pull/${pr.number}
              ${`Type: ${pr.releaseType}`.padStart(20)} | ${pr.title}
          `
        })
        .join('\n\n')}
    `}\n\n`
  )

  if (process.platform === 'darwin' && typeof jest === 'undefined') {
    await clipboardCopy(formattedRelatedNotes)
    // eslint-disable-next-line no-console
    console.info(
      stripIndents`
        ${''.padStart(40, '👇')}

        Copied the release notes to your clipboard!

        ${''.padStart(40, '👆')}
      `.trim()
    )
  }
}

main().catch((e) => {
  console.error(e)
  // eslint-disable-next-line no-process-exit
  process.exit(1)
})

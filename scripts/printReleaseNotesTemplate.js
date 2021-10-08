const prettier = require('prettier')
const fetch = require('node-fetch')
const execa = require('execa')
const {uniqBy, groupBy} = require('lodash')
const {oneLine} = require('common-tags')

const COMMITS_COMMAND =
  "git log --pretty=format:'%h' --abbrev-commit --reverse $(git describe --abbrev=0)..origin/next"
const CHANGELOG_COMMAND =
  "git log --pretty=format:'%aN | %s | %h' --abbrev-commit --reverse $(git describe --abbrev=0)..origin/next"

async function getPrsFromCommits(commits) {
  if (!commits.length) return []

  const sliceSize = 10
  const firstTenCommits = commits.slice(0, sliceSize).join(' ')

  const response = await fetch(
    `https://api.github.com/search/issues?q=${firstTenCommits}+repo:sanity-io/sanity+is:pr`
  )
  if (!response.ok) {
    throw new Error(`Failed to get PRs from GitHub. ${await response.text()}`)
  }

  const data = await response.json()
  if (!Array.isArray(data?.items)) {
    throw new Error(`GitHub response did not have items array.`)
  }

  const next = await getPrsFromCommits(commits.slice(sliceSize))

  return [...data.items, ...next]
}

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

  if (releaseType === 'featureOneline' || releaseType === 'bugfixesOneline') {
    releaseNote = oneLine(releaseNote)
  }

  return {releaseType, releaseNote}
}

async function pbcopy(data) {
  const proc = require('child_process').spawn('pbcopy')
  proc.stdin.write(data)
  await new Promise((resolve) => proc.stdin.end(resolve))
}

async function main() {
  const commits = (await execa.command(COMMITS_COMMAND, {shell: true})).stdout
    .trim()
    .split('\n')
    .filter(Boolean)

  const prs = uniqBy(await getPrsFromCommits(commits), (pr) => pr.number).sort(
    (a, b) => a.number - b.number
  )

  const {
    featuresHighlighted = [],
    featuresOneline = [],
    bugfixesOneline = [],
    bugfixesHighlighted = [],
  } = groupBy(
    prs
      .map((pr) => ({
        number: pr.number,
        ...parsePrBody(pr.body),
      }))
      .filter((pr) => pr.releaseNote),
    (pr) => pr.releaseType
  )

  // NOTE: if you update this template, please also update SANITY_RELEASE_NOTES_TEMPLATE.md
  const releaseNotes = `
<!--
-------- SANITY RELEASE NOTES TEMPLATE (delete me) --------
Use the following template as a starting point for next release:
A draft can be created here: https://github.com/sanity-io/sanity/releases/new

See here for a static template if this one was not auto-generated correctly:
https://github.com/sanity-io/sanity/blob/next/.github/SANITY_RELEASE_NOTES_TEMPLATE.md

The following PRs were found from the commits:

${prs.map((pr) => `- ${pr.title}\n  ${pr.html_url}`).join('\n\n')}

-->

Upgrade the Command Line Interface (CLI) with:

    npm install --global @sanity/cli

Upgrade Sanity Studio with:

    sanity upgrade

${featuresHighlighted.length || featuresOneline.length ? '# ✨ Highlights' : ''}

${featuresHighlighted
  .map((pr) => {
    const [firstLine, ...restOfLines] = pr.releaseNote.trim().split('\n')
    return [`${firstLine} (#${pr.number})`, ...restOfLines].join('\n')
  })
  .join('\n\n')}

${featuresHighlighted.length && featuresOneline.length ? '## Other notable features' : ''}

${featuresOneline.map((pr) => `- ${pr.releaseNote} (#${pr.number})`).join('\n')}

${bugfixesHighlighted.length || bugfixesOneline.length ? '# 🐛 Notable bugfixes' : ''}

${bugfixesHighlighted
  .map((pr) => {
    const [firstLine, ...restOfLines] = pr.releaseNote.trim().split('\n')
    return [`${firstLine} (#${pr.number})`, ...restOfLines].join('\n')
  })
  .join('\n\n')}

${featuresHighlighted.length && featuresOneline.length ? '## Other notable bugfixes' : ''}

${bugfixesOneline.map((pr) => `- ${pr.releaseNote} (#${pr.number})`).join('\n')}

# 📓 Full changelog

Author | Message | Commit
------------ | ------------- | -------------
${(await execa.command(CHANGELOG_COMMAND, {shell: true})).stdout}
`

  const formattedRelatedNotes = prettier.format(releaseNotes, {parser: 'markdown'})

  // eslint-disable-next-line no-console
  console.info(formattedRelatedNotes)

  if (process.platform === 'darwin' && typeof jest === 'undefined') {
    await pbcopy(formattedRelatedNotes)
    // eslint-disable-next-line no-console
    console.info(`Copied the above to your clipboard!`)
  }
}

module.exports = main()

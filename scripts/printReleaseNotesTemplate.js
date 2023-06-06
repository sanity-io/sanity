const execa = require('execa')
const yargs = require('yargs')
const {hideBin} = require('yargs/helpers')

const flags = yargs(hideBin(process.argv)).argv

const revParsed = execa.commandSync('git rev-parse --abbrev-ref HEAD', {shell: true}).stdout.trim()
const isFromV3 = revParsed === 'v3' || revParsed === 'v3-current'

const BASE_BRANCH = isFromV3 ? revParsed : 'next'
const PREV_RELEASE =
  flags.from || execa.commandSync('git describe --abbrev=0', {shell: true}).stdout.trim()
const CHANGELOG_COMMAND = `git log --pretty=format:'%aN | %s | %h' --abbrev-commit --reverse ${PREV_RELEASE}..origin/${BASE_BRANCH}`

const TEMPLATE = `
## Installation and upgrading

**To initiate a new Studio without installing the CLI globally:**

    npm create sanity@latest

**To upgrade a v3 Studio, run this command in its folder:**

    npm install sanity@latest

# ✨ Highlights

## Awesome feature X

A few words about the awesome feature X, preferably with screengifs

## Awesome feature Y

A few words about the awesome feature Y, preferably with screengifs

## Other features

- This is feature is not that important, but worth mentioning anyway

# 🐛 Notable bugfixes
- Fixes 🐞
- Fixes 🐛
- Fixes 🦗

# 📓 Full changelog
Author | Message | Commit
------------ | ------------- | -------------
${execa.commandSync(CHANGELOG_COMMAND, {shell: true}).stdout}
`

// eslint-disable-next-line no-console
console.log(`
-------- SANITY RELEASE NOTES TEMPLATE --------
Use the following template as a starting point for next release:
A draft can be created here: https://github.com/sanity-io/sanity/releases/new

-------- BEGIN TEMPLATE --------
${TEMPLATE}
-------- END TEMPLATE --------`)

import execa from 'execa'
import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'

const GITHUB_PR_URL = 'https://github.com/sanity-io/sanity/pull/'

const flags = yargs(hideBin(process.argv)).argv as Record<string, any>

const revParsed = execa.commandSync('git rev-parse --abbrev-ref HEAD', {shell: true}).stdout.trim()
const isFromV3 = revParsed === 'v3' || revParsed === 'v3-current'

const BASE_BRANCH = isFromV3 ? revParsed : 'main'
const PREV_RELEASE =
  flags.from || execa.commandSync('git describe --abbrev=0', {shell: true}).stdout.trim()
const CHANGELOG_COMMAND = `git log --pretty=format:'%aN | %s | %h' --abbrev-commit --reverse ${PREV_RELEASE}..origin/${BASE_BRANCH}`

const withPrLinks = (changelog: string) =>
  changelog.replace(/\(#(\d+)\)/g, `([#$1](${GITHUB_PR_URL}$1))`)

const TEMPLATE = `
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

# Install or upgrade Sanity Studio

To initiate a new Sanity Studio project or upgrade an existing one, please refer to our comprehensive guide on [Installing and Upgrading Sanity Studio](https://www.sanity.io/docs/upgrade).

If you are updating from a version earlier than [3.37.0](https://www.sanity.io/changelog/93306939-973b-4e48-bb63-89a6b91d70b3), you should also check out [this article](https://www.sanity.io/help/upgrade-packages) to ensure your dependencies are up to date.

# 📓 Full changelog
Author | Message | Commit
------------ | ------------- | -------------
${withPrLinks(execa.commandSync(CHANGELOG_COMMAND, {shell: true}).stdout)}
`

console.log(`<!--
SANITY RELEASE NOTES TEMPLATE
Use the following template as a starting point for next release:
A draft can be created here: https://github.com/sanity-io/sanity/releases/new
-->

${TEMPLATE}
<!-- END TEMPLATE -->
`)

import execa from 'execa'
import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'

const GITHUB_PR_URL = 'https://github.com/sanity-io/sanity/pull/'

const flags = yargs(hideBin(process.argv)).argv as Record<string, any>

const BASE_BRANCH = 'v4'
const PREV_RELEASE =
  flags.from || execa.commandSync('git describe --abbrev=0', {shell: true}).stdout.trim()
const CHANGELOG_COMMAND = `git log --pretty=format:'%aN | %s | %h' --abbrev-commit --reverse ${PREV_RELEASE}..origin/${BASE_BRANCH}`

const withPrLinks = (changelog: string) =>
  changelog.replace(/\(#(\d+)\)/g, `([#$1](${GITHUB_PR_URL}$1))`)

const TEMPLATE = `
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

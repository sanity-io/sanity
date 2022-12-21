const CHANGELOG_COMMAND =
  "git log --pretty=format:'%aN | %s | %h' --abbrev-commit --reverse $(git describe --abbrev=0)..origin/2.x-next"

const execa = require('execa')

const TEMPLATE = `
**⚠️ THIS IS A MAINTENANCE RELEASE OF A PREVIOUS MAJOR VERSION OF SANITY**

We recommend updating to Sanity Studio v3 which provides exceptional flexibility and an unparalleled developer experience. The core packages for Sanity Studio v2 will only receive critical bug fixes until Dec 7th, 2023

Please head over to the documentation for [Sanity Studio v3](https://www.sanity.io/docs/sanity-studio) to learn more.

You can find [migration guides from Studio v2 here](https://www.sanity.io/docs/migrating-from-v2).

## Installation and upgrading

Upgrade the **v2 version** of the Command Line Interface (CLI) with:

    npm install --global @sanity/cli@v2

Upgrade Sanity Studio with:

    sanity upgrade

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

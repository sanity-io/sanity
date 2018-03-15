const CHANGELOG_COMMAND =
  "git log --pretty=format:'%aN | %s | %h' --abbrev-commit --reverse origin/master..origin/next"

const execa = require('execa')

const TEMPLATE = `
Upgrade with:

    sanity upgrade

And install the latest Command Line Interface (CLI) with:

    npm install --global @sanity/cli

# ✨ Highlights
## Awesome feature X
A few words about the awesome feature X, preferably with screengifs

## Awesome feature Y
A few words about the awesome feature Y, preferably with screengifs

## Other features
- This is feature is not that important, but worth mentioning anyway

# 🐛 Notable bugfixes
- Fixed 🐞
- Fixed 🐛
- Fixed 🦗

# 📓 Full changelog
Author | Message | Commit
------------ | ------------- | -------------
${execa.shellSync(CHANGELOG_COMMAND).stdout}
`

console.log(`
-------- SANITY RELEASE NOTES TEMPLATE --------
Use the following template as a starting point for next release:
A draft can be created here: https://github.com/sanity-io/sanity/releases/new

-------- BEGIN TEMPLATE --------
${TEMPLATE}
-------- END TEMPLATE --------`)

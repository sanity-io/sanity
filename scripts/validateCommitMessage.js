const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const boxen = require('boxen')
const childProc = require('child_process')

const commitMsgPath = path.join(__dirname, '..', process.env.GIT_PARAMS)
const msg = fs.readFileSync(commitMsgPath, 'utf8').trim()

const template = /^\[[a-z-\/]+]\s[A-Z0-9]\w+/

if (!template.test(msg)) {
  console.error(boxen([
    chalk.yellow('No, your commit message should look like this:'),
    chalk.green('[package] Description of the change'), '',
    'Example:',
    chalk.green('[desk-tool] Improve performance of list rendering')
  ].join('\n'), {padding: 1, margin: 1, borderStyle: 'double', borderColor: 'red'}))
  process.exit(1)
}

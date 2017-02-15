const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const childProc = require('child_process')

const commitMsgPath = path.join(__dirname, '..', process.env.GIT_PARAMS)
const msg = fs.readFileSync(commitMsgPath, 'utf8').trim()

const template = /^\[[a-z\/]+]\s[A-Z0-9]\w+/

if (!template.test(msg)) {
  console.error(chalk.red('No, your commit message should look like this:'))
  console.error(chalk.yellow('[package] Description of the change'))
  process.exit(1)
}

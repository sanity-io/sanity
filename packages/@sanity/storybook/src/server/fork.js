/* eslint-disable no-process-env, no-process-exit */
const path = require('path')
const fork = require('child_process').fork
const shelljs = require('shelljs')

const serverPath = path.join(__dirname, 'server.js')

module.exports = config => {
  const {output, chalk} = config.context

  const debug = (process.env.DEBUG || '').indexOf('storybook') >= 0

  // The repository info is sent to the storybook while running on
  // development mode so it'll be easier for tools to integrate.
  const exec = cmd => shelljs.exec(cmd, {silent: true}).stdout.trim()
  const env = Object.assign({}, process.env, {
    STORYBOOK_GIT_ORIGIN: process.env.STORYBOOK_GIT_ORIGIN || exec('git remote get-url origin'),
    STORYBOOK_GIT_BRANCH: process.env.STORYBOOK_GIT_BRANCH || exec('git symbolic-ref HEAD --short'),
  })

  // For the server process so we don't block the main thread while it's compiling/doing it's thing
  const proc = fork(serverPath, {env, silent: true})

  proc.on('message', msg => {
    if (msg.event === 'listening') {
      output.print(`Storybook listening on ${msg.url}`)
    }
  })

  proc.stderr.on('data', data => {
    output.print(chalk.red(`Storybook: ${data}`))
  })

  if (debug) {
    proc.stdout.on('data', data => {
      output.print(chalk.cyan(`Storybook: ${data}`))
    })
  }

  proc.send({event: 'start', config})
}

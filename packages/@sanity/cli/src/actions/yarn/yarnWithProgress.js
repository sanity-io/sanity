/* eslint-disable no-process-env */
import path from 'path'
import ora from 'ora'
import execa from 'execa'
import split2 from 'split2'
import chalk from 'chalk'
import progrescii from 'progrescii'
import noop from 'lodash/noop'
import padEnd from 'lodash/padEnd'
import throttle from 'lodash/throttle'

// Use require.resolve to ensure it actually exists
const binDir = path.join(__dirname, '..', '..', '..', 'vendor')
const yarnPath = require.resolve(path.join(binDir, 'yarn'))

export default function yarnWithProgress(args, options = {}) {
  /* eslint-disable no-console */
  const print = options.print || console.log
  const error = options.error || console.error
  /* eslint-enable no-console */

  const padLength = 'Resolving dependencies'.length
  const getProgressTemplate = (symbol, msg) =>
    `${symbol} ${padEnd(msg, padLength)} :b :p% (:ts)`

  const execOpts = Object.assign({
    cwd: options.rootDir || process.cwd(),
    env: {PATH: [binDir, process.env.PATH].join(path.delimiter)}
  }, options.execOpts || {})

  const proc = execa(yarnPath, args.concat(['--json']), execOpts)
  proc.catch(onNativeError);

  [proc.stdout, proc.stderr].forEach(stream => {
    stream
      .pipe(split2(JSON.parse))
      .on('data', onChunk)
      .on('error', onNativeError)
  })

  const state = {}
  const interceptors = options.interceptors || {}
  const throttledOnProgressTick = throttle(onProgressTick, 50)

  function onChunk(event) { // eslint-disable-line complexity
    if (interceptors[event.type]) {
      return interceptors[event.type](event)
    }

    switch (event.type) {
      case 'error':
        return onError(event)
      case 'warning':
        return onWarning(event)
      case 'step':
        return onStep(event)
      case 'activityStart':
        return onActivityStart(event)
      case 'activityTick':
        return onActivityTick(event)
      case 'activitySetEnd':
      case 'activityEnd':
        return onActivityEnd(event)
      case 'progressStart':
        return onProgressStart(event)
      case 'progressTick':
        return throttledOnProgressTick(event)
      case 'progressFinish':
        return onProgressFinish(event)
      case 'success':
        return onSuccess(event)
      case 'finished':
        return onFinished(event)
      default:
        // console.log(event)
        return noop()
    }
  }

  function onActivityStart(event) {
    if (!state.step) {
      return
    }

    state.spinner = ora(state.step.message).start()
  }

  function onActivityTick(event) {
    if (!state.spinner) {
      return
    }

    state.spinner.text = `${state.step.message} (${event.data.name})`
  }

  function onActivityEnd(event) {
    if (!state.spinner) {
      return
    }

    state.spinner.text = state.step.message
    state.spinner.succeed()
  }

  function onProgressStart(event) {
    if (state.spinner) {
      state.spinner.stop()
    }

    state.progress = progrescii.create({
      template: getProgressTemplate(chalk.yellow('●'), state.step.message),
      total: event.data.total
    })
  }

  function onProgressTick(event) {
    const prog = state.progress
    if (!prog) {
      return
    }

    if (event.data.current >= prog.total) {
      return // Will be taken care of by onProgressFinish
    }

    state.progress.set(event.data.current)
  }

  function onProgressFinish(event) {
    const prog = state.progress
    if (!prog) {
      return
    }

    prog.template = getProgressTemplate(chalk.green('✔'), state.step.message)
    prog.set(prog.total)
  }

  function onStep(event) {
    state.step = event.data
  }

  function onSuccess(event) {
    if (state.spinner) {
      state.spinner.stop()
    }

    print(`${chalk.green('✔')} Saved lockfile`)
  }

  function onFinished(event) {
    if (state.spinner) {
      state.spinner.stop()
    }

    const time = `${(event.data / 1000).toFixed(2)}s`
    print(`${chalk.green('✔')} Done in ${time}`)
  }

  function onWarning(event) {
    // For now, skip the warnings as they seem to only contain the first line of the text,
    // so it makes no sense to show it. Debug this later and consider reimplementing this.
    // holdSpinner(() => print(`${chalk.yellow('●')} ${event.data}`))
  }

  function onError(event) {
    // Skip certain errors from being logged
    if (shouldIgnoreError(event)) {
      return
    }

    if (state.spinner) {
      state.spinner.fail()
    }

    error(`${chalk.red('✖')} ${event.data}`)
  }

  function onNativeError(err) {
    if (state.spinner) {
      state.spinner.fail()
    }

    throw err
  }

  function holdSpinner(op) {
    if (state.spinner) {
      state.spinner.stop()
    }

    op()

    if (state.spinner) {
      state.spinner.start()
    }
  }

  return proc.catch(err => {
    const detailed = new Error('Command failed :(')
    detailed.code = err.code
    detailed.killed = err.killed
    detailed.err = err.message
    throw detailed
  })
}


const ignoredMessages = [
  'install script for optional dependency',
  'Command failed: yarn'
]

function shouldIgnoreError(event) {
  if (!event || !event.data) {
    return false
  }

  return ignoredMessages.some(ignore => event.data.indexOf(ignore) !== -1)
}

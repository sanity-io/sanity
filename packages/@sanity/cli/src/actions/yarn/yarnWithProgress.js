/* eslint-disable no-process-env */
import path from 'path'
import ora from 'ora'
import execa from 'execa'
import split2 from 'split2'
import chalk from 'chalk'
import progrescii from 'progrescii'
import {noop, padEnd, throttle} from 'lodash'

const useProgress = process.stderr && process.stderr.isTTY && !process.env.CI
const isBundled = typeof __SANITY_IS_BUNDLED__ !== 'undefined'

// Use require.resolve to ensure it actually exists in development mode
const binDir = path.join(__dirname, '..', '..', '..', 'vendor')
const yarnPath = isBundled
  ? path.join(__dirname, '..', 'vendor', 'yarn')
  : require.resolve(path.join(binDir, 'yarn'))

const parseJson = data => {
  try {
    return JSON.parse(data)
  } catch (err) {
    return undefined
  }
}

export default function yarnWithProgress(args, options = {}) {
  /* eslint-disable no-console */
  const print = options.print || console.log
  const error = options.error || console.error
  /* eslint-enable no-console */

  const padLength = 'Resolving dependencies'.length
  const getProgressTemplate = (symbol, msg) => `${symbol} ${padEnd(msg, padLength)} :b :p% (:ts)`

  const execOpts = Object.assign(
    {
      cwd: options.rootDir || process.cwd(),
      env: {PATH: [binDir, process.env.PATH].join(path.delimiter)}
    },
    options.execOpts || {}
  )

  const nodePath = process.argv[0]
  const nodeArgs = [yarnPath].concat(args, ['--json', '--non-interactive'])

  const state = {firstStepReceived: false, currentProgressStep: null}

  // Yarn takes a while before starting to emit events, we want to show
  // some sort of indication while it's getting started
  onStep({data: {message: 'Resolving dependencies'}})
  onActivityStart({})

  const proc = execa(nodePath, nodeArgs, execOpts)
  proc.catch(onNativeError)

  // Will throw error async through the promise above
  if (!proc.stdout) {
    return proc
  }

  [proc.stdout, proc.stderr].forEach(stream => {
    stream
      .pipe(split2(parseJson))
      .on('data', onChunk)
      .on('error', onNativeError)
  })

  const interceptors = options.interceptors || {}
  const throttledOnProgressTick = throttle(onProgressTick, 50)

  function onChunk(event) {
    // eslint-disable-line complexity
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

    if (!state.firstStepReceived && state.spinner) {
      state.firstStepReceived = true
      onActivityEnd()
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
    // For some events (Linking dependencies, for instance), multiple progress
    // start events are emitted, which doesn't look great. Skip those.
    if (state.step.message === state.currentProgressStep) {
      return
    }

    if (state.spinner) {
      state.spinner.stop()
    }

    if (useProgress && event.data.total) {
      state.currentProgressStep = state.step.message
      state.progress = progrescii.create({
        template: getProgressTemplate(chalk.yellow('●'), state.step.message),
        total: event.data.total
      })
    } else {
      print(`${chalk.yellow('●')} ${state.step.message}`)
    }
  }

  function onProgressTick(event) {
    const prog = state.progress
    if (!prog) {
      return
    }

    if (event.data.current >= prog.total) {
      return // Will be taken care of by onProgressFinish
    }

    prog.set(event.data.current)
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

    print(`\n${chalk.green('✔')} Saved lockfile`)
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

  return proc.catch(err => {
    const detailed = new Error('Command failed :(')
    detailed.code = err.code
    detailed.killed = err.killed
    detailed.err = err.message
    throw detailed
  })
}

const ignoredMessages = ['install script for optional dependency', 'Command failed: yarn']

function shouldIgnoreError(event) {
  if (!event || !event.data) {
    return false
  }

  return ignoredMessages.some(ignore => event.data.indexOf(ignore) !== -1)
}

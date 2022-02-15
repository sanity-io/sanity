/* global __SANITY_IS_BUNDLED__ */
/* eslint-disable no-process-env */
import path from 'path'
import ora, {Ora} from 'ora'
import execa from 'execa'
import split2 from 'split2'
import chalk from 'chalk'
import Gauge from 'gauge'
import {noop, throttle} from 'lodash'
import {dynamicRequire} from '../../util/dynamicRequire'
import {
  YarnActivityEndEvent,
  YarnActivitySetEndEvent,
  YarnActivityStartEvent,
  YarnActivityTickEvent,
  YarnErrorEvent,
  YarnEvent,
  YarnFinishedEvent,
  YarnProgressFinishEvent,
  YarnProgressStartEvent,
  YarnProgressTickEvent,
  YarnStepEvent,
  YarnSuccessEvent,
  YarnWarningEvent,
} from './events'

const useProgress = process.stderr && process.stderr.isTTY && !process.env.CI
const isBundled = typeof __SANITY_IS_BUNDLED__ !== 'undefined'

// Use require.resolve to ensure it actually exists in development mode
const binDir = path.join(__dirname, '..', '..', '..', 'vendor')
const yarnPath = isBundled
  ? path.join(__dirname, '..', 'vendor', 'yarn')
  : dynamicRequire.resolve(path.join(binDir, 'yarn'))

const parseJson = (data: string) => {
  try {
    return JSON.parse(data)
  } catch (err) {
    return undefined
  }
}

interface YarnOptions {
  print?: (...args: any[]) => void
  error?: (...args: any[]) => void

  rootDir?: string
  execOpts?: execa.Options<string>
  interceptors?: Record<string, (event: YarnEvent) => void>
}

interface YarnWithProgressState {
  step: YarnStepEvent['data']
  firstStepReceived: boolean
  progressTotal?: number
  currentProgressStep: string | null
  progress: typeof Gauge
  spinner?: Ora
}

export function yarnWithProgress(
  args: string[],
  options: YarnOptions = {}
): Promise<execa.ExecaReturnValue<string>> {
  /* eslint-disable no-console */
  const print = options.print || console.log
  const error = options.error || console.error
  /* eslint-enable no-console */

  const execOpts = {
    cwd: options.rootDir || process.cwd(),
    env: {PATH: [binDir, process.env.PATH].join(path.delimiter)},
    ...(options.execOpts || {}),
  }

  const nodePath = process.argv[0]
  const nodeArgs = [yarnPath].concat(args, [
    '--json',
    '--non-interactive',
    '--ignore-engines',
    '--network-timeout',
    '60000',
    '--registry',
    'https://registry.npmjs.org',
  ])

  const state: YarnWithProgressState = {
    step: {message: 'Resolving dependencies'},
    firstStepReceived: false,
    currentProgressStep: null,
    progress: new Gauge(process.stderr, {
      theme: 'colorASCII',
      enabled: true,
    }),
    spinner: undefined,
  }

  // Yarn takes a while before starting to emit events, we want to show
  // some sort of indication while it's getting started
  onStep({type: 'step', data: {message: 'Resolving dependencies'}})
  onActivityStart({type: 'activityStart'})

  const proc = execa(nodePath, nodeArgs, execOpts)
  proc.catch(onNativeError)

  // Will throw error async through the promise above
  if (!proc.stdout) {
    return proc
  }

  const streams = [proc.stdout, proc.stderr]
  streams.forEach((stream) => {
    if (!stream) {
      return
    }

    stream.pipe(split2(parseJson)).on('data', onChunk).on('error', onNativeError)
  })

  const interceptors = options.interceptors || {}
  const throttledOnProgressTick = throttle(onProgressTick, 50)

  // eslint-disable-next-line complexity
  function onChunk(event: YarnEvent) {
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

  function onActivityStart(event: YarnActivityStartEvent) {
    if (!state.step) {
      return
    }

    if (!state.firstStepReceived && state.spinner) {
      state.firstStepReceived = true
      onActivityEnd({type: 'activityEnd'})
    }

    state.spinner = ora(state.step.message).start()
  }

  function onActivityTick(event: YarnActivityTickEvent) {
    if (!state.spinner) {
      return
    }

    state.spinner.text = `${state.step.message} (${event.data.name})`
  }

  function onActivityEnd(event: YarnActivityEndEvent | YarnActivitySetEndEvent) {
    if (!state.spinner) {
      return
    }

    state.spinner.text = state.step.message
    state.spinner.succeed()
  }

  function onProgressStart(event: YarnProgressStartEvent) {
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
      state.progressTotal = event.data.total
      state.progress.show(state.step.message, 0)
    } else {
      print(`${chalk.yellow('●')} ${state.step.message}`)
    }
  }

  function onProgressTick(event: YarnProgressTickEvent) {
    const prog = state.progress
    if (!prog) {
      return
    }

    if (event.data.current >= prog.total) {
      return // Will be taken care of by onProgressFinish
    }

    prog.show(state.step.message, event.data.current / (state.progressTotal || 1))
  }

  function onProgressFinish(event: YarnProgressFinishEvent) {
    const prog = state.progress
    if (!prog) {
      return
    }

    prog.show(`${chalk.green('✔')} ${state.step.message}`, 1)
  }

  function onStep(event: YarnStepEvent) {
    state.step = event.data
  }

  function onSuccess(even: YarnSuccessEvent) {
    if (state.spinner) {
      state.spinner.stop()
    }

    if (state.progress) {
      state.progress.disable()
    }

    print(`\n${chalk.green('✔')} Saved lockfile`)
  }

  function onFinished(event: YarnFinishedEvent) {
    if (state.spinner) {
      state.spinner.stop()
    }

    const time = `${(event.data / 1000).toFixed(2)}s`
    print(`${chalk.green('✔')} Done in ${time}`)
  }

  function onWarning(event: YarnWarningEvent) {
    // For now, skip the warnings as they seem to only contain the first line of the text,
    // so it makes no sense to show it. Debug this later and consider reimplementing this.
  }

  function onError(event: YarnErrorEvent) {
    // Skip certain errors from being logged
    if (shouldIgnoreError(event)) {
      return
    }

    if (state.spinner) {
      state.spinner.fail()
    }

    error(`${chalk.red('✖')} ${event.data}`)
  }

  function onNativeError(err: Error) {
    if (state.spinner) {
      state.spinner.fail()
    }

    throw err
  }

  return proc
}

const ignoredMessages = ['install script for optional dependency', 'Command failed: yarn']

function shouldIgnoreError(event: YarnErrorEvent) {
  if (!event || !event.data) {
    return false
  }

  return ignoredMessages.some((ignore) => event.data.indexOf(ignore) !== -1)
}

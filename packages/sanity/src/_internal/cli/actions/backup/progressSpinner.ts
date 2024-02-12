import {type CliOutputter} from '@sanity/cli'
import prettyMs from 'pretty-ms'

type ProgressEvent = {
  step: string
  update?: boolean
  current?: number
  total?: number
}

interface ProgressSpinner {
  set: (progress: ProgressEvent) => void
  update: (progress: ProgressEvent) => void
  succeed: () => void
  fail: () => void
}

const newProgress = (output: CliOutputter, startStep: string): ProgressSpinner => {
  let spinner = output.spinner(startStep).start()
  let lastProgress: ProgressEvent = {step: startStep}
  let start = Date.now()

  const print = (progress: ProgressEvent) => {
    const elapsed = prettyMs(Date.now() - start)
    if (progress.current && progress.current > 0 && progress.total && progress.total > 0) {
      spinner.text = `${progress.step} (${progress.current}/${progress.total}) [${elapsed}]`
    } else {
      spinner.text = `${progress.step} [${elapsed}]`
    }
  }

  return {
    set: (progress: ProgressEvent) => {
      if (progress.step !== lastProgress.step) {
        print(lastProgress) // Print the last progress before moving on
        spinner.succeed()
        spinner = output.spinner(progress.step).start()
        start = Date.now()
      } else if (progress.step === lastProgress.step && progress.update) {
        print(progress)
      }
      lastProgress = progress
    },
    update: (progress: ProgressEvent) => {
      print(progress)
      lastProgress = progress
    },
    succeed: () => {
      spinner.succeed()
      start = Date.now()
    },
    fail: () => {
      spinner.fail()
      start = Date.now()
    },
  }
}

export default newProgress

const triggerInputEvent = (input: HTMLElement, nextValue: unknown) => {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    input.constructor.prototype,
    'value'
  )!.set
  nativeInputValueSetter!.call(input, nextValue)
  input.dispatchEvent(new Event('input', {bubbles: true}))
}

function format(string: string, ...args: Array<string | number>) {
  return string.replace(/{(\d+)}/g, (match, index) => {
    return typeof args[index] === 'undefined' ? match : String(args[index])
  })
}

const chars = 'abcdefghijklmnopqrstuvwxyz'.split('')

interface TestOptions {
  inputElement: HTMLInputElement | HTMLTextAreaElement
  times: number
  gracePeriod: number
  onRun: (output: string) => void
  onFinished: () => void
}

export function runTest(props: TestOptions): () => boolean {
  const {inputElement, times = 3, gracePeriod = 4000, onRun, onFinished} = props

  const originalValue = inputElement.value
  let total = 0
  let sampleNo = 0
  let remainingSamples = times
  let handleRun = onRun
  let timer: NodeJS.Timeout

  function cancelTimer() {
    if (timer) {
      clearTimeout(timer)
      return true
    }
    return false
  }

  // If we call `runTest` from within a React event handler, React will batch up any calls to setState happening
  // synchronously within the same call stack, and defer any re-render til the event handler completes
  // This means the first sample will be super fast because React will not re-render at all while it is running
  // For this reason we want to schedule the first sample async to escape the React event call stack
  Promise.resolve().then(sampleNext)

  if (!handleRun) {
    // eslint-disable-next-line no-console
    handleRun = console.log
  }

  function sampleNext() {
    sampleNo++
    remainingSamples--
    const start = performance.now()
    chars.forEach((char) => triggerInputEvent(inputElement, `Typing ${char}`))
    const duration = performance.now() - start
    total += duration
    // eslint-disable-next-line callback-return
    handleRun(
      format(
        'Sample #{0}: {1}ms, avg: {2}ms',
        sampleNo,
        duration.toPrecision(4),
        (total / sampleNo).toPrecision(4)
      )
    )
    if (remainingSamples > 0) {
      timer = setTimeout(sampleNext, gracePeriod)
    } else {
      // eslint-disable-next-line callback-return
      handleRun(
        format('Average of {0} samples: {1}ms', sampleNo, (total / sampleNo).toPrecision(4))
      )
      onFinished()
      triggerInputEvent(inputElement, originalValue)
    }
  }

  return cancelTimer
}

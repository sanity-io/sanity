import ora from 'ora'

export function startTimer(label: string): {end: () => void} {
  const spinner = ora(label).start()
  const start = Date.now()
  return {
    end: () => spinner.succeed(`${label} (${formatMs(Date.now() - start)})`),
  }
}

function formatMs(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`
}

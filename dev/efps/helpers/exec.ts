import {spawn} from 'node:child_process'
import process from 'node:process'

import chalk from 'chalk'
import {type Ora} from 'ora'

interface ExecOptions {
  spinner: Ora
  command: string
  text: [string, string]
  cwd?: string
}

export async function exec({
  spinner,
  command,
  text: [inprogressText, successText],
  cwd,
}: ExecOptions): Promise<void> {
  spinner.start(inprogressText)

  const maxColumnLength = 80
  const maxLines = 12
  const outputLines: string[] = []

  function updateSpinnerText() {
    spinner.text = `${inprogressText}\n${outputLines
      .map((line) => {
        return chalk.dim(
          `${chalk.cyan('│')} ${
            line.length > maxColumnLength ? `${line.slice(0, maxColumnLength)}…` : line
          }`,
        )
      })
      .join('\n')}`
  }

  await new Promise<void>((resolve, reject) => {
    const childProcess = spawn(command, {
      shell: true,
      stdio: process.env.CI ? 'inherit' : ['inherit', 'pipe', 'pipe'],
      cwd,
    })

    function handleOutput(data: Buffer) {
      const newLines = data.toString().split('\n')
      for (const line of newLines) {
        if (line.trim() !== '') {
          outputLines.push(line.trim())
          if (outputLines.length > maxLines) {
            outputLines.shift()
          }
          updateSpinnerText()
        }
      }
    }

    childProcess.stdout?.on('data', handleOutput)
    childProcess.stderr?.on('data', handleOutput)

    childProcess.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Command exited with code ${code}`))
    })

    childProcess.on('error', (error) => {
      reject(error)
    })
  })

  spinner.succeed(successText)
}

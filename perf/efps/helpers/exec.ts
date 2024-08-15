import {spawn} from 'node:child_process'

import {type Ora} from 'ora'

// function createQuotedStream(outputStream) {
//   return new Writable({
//     write(chunk, _encoding, callback) {
//       outputStream.write(
//         chalk.dim(
//           chunk
//             .toString('utf-8')
//             .split('\n')
//             .filter(Boolean)
//             .map((line) => `${chalk.blue(`│`)} ${line}\n`)
//             .join(''),
//         ),
//       )
//       callback()
//     },
//   })
// }

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

  await new Promise<void>((resolve, reject) => {
    const childProcess = spawn(command, {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      // env: {...process.env, FORCE_COLOR: 'true'},
      cwd,
    })

    // TODO: output stdio to the spinner
    // const stdoutStream = createQuotedStream(process.stdout)
    // const stderrStream = createQuotedStream(process.stderr)

    // childProcess.stdout.pipe(stdoutStream)
    // childProcess.stderr.pipe(stderrStream)

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command exited with code ${code}`))
      }
    })

    childProcess.on('error', (error) => {
      reject(error)
    })
  })

  spinner.succeed(successText)
}

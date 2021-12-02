import {exec, spawn} from 'child_process'
import path from 'path'
// import chalk from 'chalk'
import cpx from 'cpx'

export function copyFiles(opts: {
  srcPath: string
  libPath: string
  watch?: boolean
}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (opts.watch) {
      const watcher = cpx.watch(
        path.resolve(opts.srcPath, '**/*.!(*js|*jsx|*ts|*tsx)'),
        opts.libPath
      )

      watcher.on('copy', () => {
        // console.log(`${chalk.green('copied')} ${event.srcPath} to ${event.dstPath}`)
      })

      watcher.on('remove', () => {
        // console.log(`${chalk.red('removed')} ${event.path}`)
      })

      resolve(undefined)
    } else {
      cpx.copy(path.resolve(opts.srcPath, '**/*.!(*js|*jsx|*ts|*tsx)'), opts.libPath, (err) => {
        if (err) reject(err)
        else resolve(undefined)
      })
    }
  })
}

export function compileDTS(opts: {cwd: string; tsconfig?: string; watch?: boolean}): Promise<void> {
  const {cwd, tsconfig = 'tsconfig.json', watch} = opts

  if (watch) {
    const ls = spawn(
      'tsc',
      ['-emitDeclarationOnly', '--preserveWatchOutput', '--project', tsconfig, '--watch'],
      {cwd}
    )

    ls.stdout.on('data', (data) => {
      const lines = String(data).trim().split('\n')

      for (const line of lines) {
        if (line) console.log(`[tsc] ${line}`)
      }
    })

    ls.stderr.on('data', (data) => {
      const lines = String(data).trim().split('\n')

      for (const line of lines) {
        if (line) console.error(`[tsc] ${line}`)
      }
    })

    ls.on('close', (code) => {
      console.log(`[tsc] exited with code ${code}`)
    })

    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    exec(`tsc --emitDeclarationOnly --project ${tsconfig}`, {cwd}, (err, stdout, stderr) => {
      if (stdout) console.log(stdout)
      if (stderr) console.log(stderr)
      if (err) reject(err)
      else resolve()
    })
  })
}

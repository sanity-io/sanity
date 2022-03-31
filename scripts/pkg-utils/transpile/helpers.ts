// import {exec, spawn} from 'child_process'
import path from 'path'
import cpx from 'cpx'
import {IGNORE_EXTENSIONS, TRANSPILE_EXTENSIONS} from './constants'

export function copyFiles(opts: {srcPath: string; libPath: string}): Promise<void> {
  const ignoredExtensions = [
    // Don't copy source files
    ...TRANSPILE_EXTENSIONS,

    // Ignore certain denied extensions
    ...IGNORE_EXTENSIONS,
  ].map((ext) => `*${ext.replace(/^\./, '')}`)

  const ignoreList = ignoredExtensions.join('|')
  const globPattern = `**/*.!(${ignoreList})`

  return new Promise((resolve, reject) => {
    cpx.copy(path.resolve(opts.srcPath, globPattern), opts.libPath, (err) => {
      if (err) reject(err)
      else resolve(undefined)
    })
  })
}

// export function compileDTS(opts: {cwd: string; tsconfig?: string; watch?: boolean}): Promise<void> {
//   const {cwd, tsconfig = 'tsconfig.json', watch} = opts

//   if (watch) {
//     const ls = spawn(
//       'tsc',
//       ['-emitDeclarationOnly', '--preserveWatchOutput', '--project', tsconfig, '--watch'],
//       {cwd}
//     )

//     ls.stdout.on('data', (data) => {
//       const lines = String(data).trim().split('\n')

//       for (const line of lines) {
//         if (line) console.log(`[tsc] ${line}`)
//       }
//     })

//     ls.stderr.on('data', (data) => {
//       const lines = String(data).trim().split('\n')

//       for (const line of lines) {
//         if (line) console.error(`[tsc] ${line}`)
//       }
//     })

//     ls.on('close', (code) => {
//       console.log(`[tsc] exited with code ${code}`)
//     })

//     return Promise.resolve()
//   }

//   return new Promise((resolve, reject) => {
//     exec(`tsc --build ./${tsconfig}`, {cwd}, (err, stdout, stderr) => {
//       if (stdout) console.log(stdout)
//       if (stderr) console.log(stderr)
//       if (err) reject(err)
//       else resolve()
//     })
//   })
// }

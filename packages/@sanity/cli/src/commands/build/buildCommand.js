import fsp from 'fs-promise'
import path from 'path'
import thenify from 'thenify'
import filesize from 'filesize'
import getConfig from '../../util/getConfig'
import {getWebpackCompiler} from '@sanity/server'
import sortModulesBySize from '../../stats/sortModulesBySize'

export default {
  name: 'build',
  signature: 'build [outputDir]',
  description: 'Builds the current Sanity configuration to a static bundle',
  action: ({print, spinner, error, options}) => {
    const outputDir = options._[1] || path.join(options.cwd, 'dist')
    const config = getConfig(options.cwd).get('server')
    const compiler = getWebpackCompiler({
      env: 'production',
      staticPath: resolveStaticPath(options.cwd, config),
      basePath: options.cwd,
      outputPath: outputDir
    })

    const compile = thenify(compiler.run.bind(compiler))

    const spin = spinner('Building Sanity...')
    spin.start()

    return compile()
      .then(statistics => {
        spin.stop();

        const stats = statistics.toJson()
        const chunkMap = {}
        const hashes = stats.chunks.forEach(chunk =>
          chunk.files.forEach(file => {
            chunkMap[file] = chunk.hash
          })
        )

        stats.warnings.forEach(print)

        print(`Build complete, time spent: ${stats.time}ms`)

        if (options.stats) {
          print('\nLargest modules (unminified, uncompressed sizes):')
          sortModulesBySize(stats.modules).slice(0, 10).forEach(module =>
            print(`[${filesize(module.size)}] ${module.name}`)
          )
        }
      })
      .catch(error)
  }
}

function resolveStaticPath(cwd, config) {
  const {staticPath} = config
  return path.isAbsolute(staticPath)
    ? staticPath
    : path.resolve(path.join(cwd, staticPath))
}

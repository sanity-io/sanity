import fsp from 'fs-promise'
import path from 'path'
import rimTheRaf from 'rimraf'
import thenify from 'thenify'
import filesize from 'filesize'
import compressJavascript from './compressJavascript'
import getConfig from '@sanity/util/lib/getConfig'
import sortModulesBySize from '../../stats/sortModulesBySize'
import {
  getWebpackCompiler,
  getDocumentElement,
  ReactDOM
} from '@sanity/server'

const rimraf = thenify(rimTheRaf)
const absoluteMatch = /^https?:\/\//i

export default async (args, context) => {
  const {output, prompt, workDir} = context
  const flags = args.extOptions
  const defaultOutputDir = path.resolve(path.join(workDir, 'dist'))
  const outputDir = path.resolve(args.argsWithoutOptions[0] || defaultOutputDir)
  const config = getConfig(workDir).get('server')
  const compilationConfig = {
    env: 'production',
    staticPath: resolveStaticPath(workDir, config),
    basePath: workDir,
    outputPath: path.join(outputDir, 'static'),
    sourceMaps: flags['source-maps'],
    skipMinify: flags['skip-minify'] || false,
    profile: flags.profile || false
  }

  const compiler = getWebpackCompiler(compilationConfig)
  const compile = thenify(compiler.run.bind(compiler))
  let shouldDelete = true

  if (outputDir !== defaultOutputDir) {
    shouldDelete = await prompt.single({
      type: 'confirm',
      message: `Do you want to delete the existing directory (${outputDir}) first?`,
      default: true
    })
  }

  let spin

  if (shouldDelete) {
    const deleteStart = Date.now()
    spin = output.spinner('Clearing output folder').start()
    await rimraf(outputDir)
    spin.text = `Clearing output folder (${Date.now() - deleteStart}ms)`
    spin.succeed()
  }

  spin = output.spinner('Building Sanity').start()

  const bundle = {}

  try {
    // Compile the bundle
    const statistics = await compile()
    const stats = statistics.toJson()
    if (stats.errors && stats.errors.length > 0) {
      throw new Error(
        `Errors while building:\n\n${stats.errors.join('\n\n')}`
      )
    }

    spin.text = `Building Sanity (${stats.time}ms)`
    spin.succeed()

    // Get hashes for each chunk
    const chunkMap = {}
    stats.chunks.forEach(chunk =>
      chunk.files.forEach(file => {
        chunkMap[file] = chunk.hash
      })
    )

    bundle.stats = stats

    // Build new index document with correct hashes
    const indexStart = Date.now()
    spin = output.spinner('Building index document').start()
    const doc = await getDocumentElement({...compilationConfig, hashes: chunkMap}, {
      scripts: ['vendor.bundle.js', 'app.bundle.js'].map(asset => {
        const assetPath = absoluteMatch.test(asset) ? asset : `js/${asset}`
        return {
          path: assetPath,
          hash: chunkMap[assetPath] || chunkMap[asset]
        }
      })
    })

    // Write index file to output destination
    await fsp.writeFile(
      path.join(outputDir, 'index.html'),
      `<!doctype html>${ReactDOM.renderToStaticMarkup(doc)}`
    )

    // Print build output, optionally stats if requested
    bundle.stats.warnings.forEach(output.print)
    spin.text = `Building index document (${Date.now() - indexStart}ms)`
    spin.succeed()

    if (flags.stats) {
      output.print('\nLargest modules (unminified, uncompressed sizes):')
      sortModulesBySize(bundle.stats.modules).slice(0, 10).forEach(module =>
        output.print(`[${filesize(module.size)}] ${module.name}`)
      )
    }

    // Now compress the JS bundles
    spin = output.spinner('Minifying Javascript bundles').start()
    const compressStart = Date.now()
    await Promise.all(Object.keys(chunkMap)
      .filter(fileName => path.extname(fileName) === '.js')
      .map(fileName => path.join(compilationConfig.outputPath, fileName))
      .map(compressJavascript)
    )

    spin.text = `Minifying Javascript bundles (${Date.now() - compressStart}ms)`
    spin.succeed()

    if (flags.profile) {
      await fsp.writeFile(
        path.join(workDir, 'build-stats.json'),
        JSON.stringify(statistics.toJson('verbose'))
      )
    }

    // Copy static assets (from /static folder) to output dir
    await fsp.copy(path.join(workDir, 'static'), path.join(outputDir, 'static'), {overwrite: false})
  } catch (err) {
    spin.fail()
    output.error(err)
  }

  return bundle
}

function resolveStaticPath(rootDir, config) {
  const {staticPath} = config
  return path.isAbsolute(staticPath)
    ? staticPath
    : path.resolve(path.join(rootDir, staticPath))
}

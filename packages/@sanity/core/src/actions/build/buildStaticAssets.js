import path from 'path'
import fse from 'fs-extra'
import rimTheRaf from 'rimraf'
import filesize from 'filesize'
import {promisify} from 'es6-promisify'
import getConfig from '@sanity/util/lib/getConfig'
import {getWebpackCompiler, getDocumentElement, ReactDOM} from '@sanity/server'
import sortModulesBySize from '../../stats/sortModulesBySize'
import checkReactCompatibility from '../../util/checkReactCompatibility'
import {tryInitializePluginConfigs} from '../config/reinitializePluginConfigs'
import compressJavascript from './compressJavascript'

const rimraf = promisify(rimTheRaf)
const absoluteMatch = /^https?:\/\//i

export default async (args, context) => {
  const overrides = args.overrides || {}
  const {output, prompt, workDir} = context
  const flags = Object.assign(
    {minify: true, profile: false, stats: false, 'source-maps': false},
    args.extOptions
  )

  const unattendedMode = flags.yes || flags.y
  const defaultOutputDir = path.resolve(path.join(workDir, 'dist'))
  const outputDir = path.resolve(args.argsWithoutOptions[0] || defaultOutputDir)
  const config = getConfig(workDir)
  const compilationConfig = {
    env: 'production',
    staticPath: resolveStaticPath(workDir, config.get('server')),
    basePath: workDir,
    outputPath: path.join(outputDir, 'static'),
    sourceMaps: flags['source-maps'],
    skipMinify: !flags.minify,
    profile: flags.profile,
    project: Object.assign({}, config.get('project'), overrides.project)
  }

  await tryInitializePluginConfigs({workDir, output})

  checkReactCompatibility(workDir)

  const compiler = getWebpackCompiler(compilationConfig)
  const compile = promisify(compiler.run.bind(compiler))
  let shouldDelete = true

  if (outputDir !== defaultOutputDir && !unattendedMode) {
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
      throw new Error(`Errors while building:\n\n${stats.errors.join('\n\n')}`)
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

    if (flags.profile) {
      await fse.writeFile(
        path.join(workDir, 'build-stats.json'),
        JSON.stringify(statistics.toJson('verbose'))
      )
    }

    // Build new index document with correct hashes
    const indexStart = Date.now()
    spin = output.spinner('Building index document').start()
    const doc = await getDocumentElement(
      {...compilationConfig, hashes: chunkMap},
      {
        scripts: ['vendor.bundle.js', 'app.bundle.js'].map(asset => {
          const assetPath = absoluteMatch.test(asset) ? asset : `js/${asset}`
          return {
            path: assetPath,
            hash: chunkMap[assetPath] || chunkMap[asset]
          }
        })
      }
    )

    // Write index file to output destination
    await fse.writeFile(
      path.join(outputDir, 'index.html'),
      `<!doctype html>${ReactDOM.renderToStaticMarkup(doc)}`
    )

    // Print build output, optionally stats if requested
    bundle.stats.warnings.forEach(output.print)
    spin.text = `Building index document (${Date.now() - indexStart}ms)`
    spin.succeed()

    if (flags.stats) {
      output.print('\nLargest modules (unminified, uncompressed sizes):')
      sortModulesBySize(bundle.stats.modules)
        .slice(0, 10)
        .forEach(module => output.print(`[${filesize(module.size)}] ${module.name}`))
    }

    // Now compress the JS bundles
    if (!compilationConfig.skipMinify) {
      spin = output.spinner('Minifying JavaScript bundles').start()
      const compressStart = Date.now()
      await Promise.all(
        Object.keys(chunkMap)
          .filter(fileName => path.extname(fileName) === '.js')
          .map(fileName => path.join(compilationConfig.outputPath, fileName))
          .map(compressJavascript)
      )

      spin.text = `Minifying JavaScript bundles (${Date.now() - compressStart}ms)`
      spin.succeed()
    }

    // Copy static assets (from /static folder) to output dir
    await fse.copy(path.join(workDir, 'static'), path.join(outputDir, 'static'), {overwrite: false})
  } catch (err) {
    spin.fail()
    throw err
  }

  return bundle
}

function resolveStaticPath(rootDir, config) {
  const {staticPath} = config
  return path.isAbsolute(staticPath) ? staticPath : path.resolve(path.join(rootDir, staticPath))
}

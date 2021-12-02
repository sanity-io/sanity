import path from 'path'
import {performance} from 'perf_hooks'
import {ModuleFormat, rollup as _rollupBundle, watch as rollupWatch} from 'rollup'
import {getBabelConfig} from '../../babel'
import {DEFAULT_EXTERNAL_DEPS} from './constants'
import {buildOptions} from './options'

export interface BundleResultFile {
  type: 'asset' | 'chunk'
  path: string
}

export async function rollupBundle(opts: {
  build: {
    format: ModuleFormat
    outDir: string
  }
  cwd: string
  external?: string[]
  input: Record<string, string>
  target: 'node' | 'web'
  tsconfig?: string
  watch?: boolean
}): Promise<BundleResultFile[]> {
  const {build, cwd, input, target, tsconfig = 'tsconfig.json'} = opts
  const external = (opts.external || []).concat(DEFAULT_EXTERNAL_DEPS)

  // NOTE: Use the babel config for the ESM format,
  // since Rollup will take care of formatting CJS/ESM modules for us.
  const babelConfig = getBabelConfig({format: 'esm'})

  const {inputOptions, outputOptions} = buildOptions({
    babelConfig,
    build,
    cwd,
    external,
    input,
    target,
    tsconfig,
  })

  if (opts.watch) {
    const watchOptions = {
      ...inputOptions,
      output: [outputOptions],
      watch: {
        // buildDelay,
        // chokidar,
        clearScreen: false,
        // skipWrite,
        exclude: 'node_modules/**',
        include: path.resolve(opts.cwd, 'src/**/*'),
      },
    }

    const watcher = rollupWatch(watchOptions)

    let startTime = 0

    // This will make sure that bundles are properly closed after each run
    watcher.on('event', (event) => {
      if (event.code === 'BUNDLE_END') {
        event.result.close()

        const durationSeconds = ((performance.now() - startTime) / 1000).toFixed(1)

        console.log(`[${opts.build.format}] bundled in ${durationSeconds}s`)

        return
      }

      if (event.code === 'BUNDLE_START') {
        startTime = performance.now()
        console.log(`[${opts.build.format}] bundling…`)
        return
      }

      if (event.code === 'END') {
        // console.log(`[${opts.build.format}] end`)
        return
      }

      if (event.code === 'ERROR') {
        // console.error('error –', event.error)
        console.log(`[${opts.build.format}] error`, event.error)
        event.result?.close()
        return
      }

      if (event.code === 'START') {
        // console.log(`[${opts.build.format}] start`)
        // return
      }
    })

    return []
  }

  // Create bundle
  const bundle = await _rollupBundle(inputOptions)

  // an array of file names this bundle depends on
  // console.log(bundle.watchFiles)

  // generate output specific code in-memory
  // you can call this function multiple times on the same bundle object
  const {output} = await bundle.generate(outputOptions)

  const files: BundleResultFile[] = []

  for (const chunkOrAsset of output) {
    if (chunkOrAsset.type === 'asset') {
      files.push({
        type: 'asset',
        path: path.resolve(opts.build.outDir, chunkOrAsset.fileName),
      })
    } else {
      files.push({
        type: 'chunk',
        path: path.resolve(opts.build.outDir, chunkOrAsset.fileName),
      })
    }
  }

  // or write the bundle to disk
  await bundle.write(outputOptions)

  // closes the bundle
  await bundle.close()

  return files
}

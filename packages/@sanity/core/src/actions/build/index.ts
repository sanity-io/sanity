import path from 'path'
import {promisify} from 'util'
import rimrafCallback from 'rimraf'
import {buildStaticFiles} from '@sanity/server'

const rimraf = promisify(rimrafCallback)

// eslint-disable-next-line max-statements
export default async (args, context) => {
  const {output, prompt, workDir} = context
  const flags = Object.assign(
    {minify: true, profile: false, stats: false, 'source-maps': false},
    args.extOptions
  )

  const unattendedMode = flags.yes || flags.y
  const defaultOutputDir = path.resolve(path.join(workDir, 'dist'))
  const outputDir = path.resolve(args.argsWithoutOptions[0] || defaultOutputDir)

  let shouldClean = true

  if (outputDir !== defaultOutputDir && !unattendedMode) {
    shouldClean = await prompt.single({
      type: 'confirm',
      message: `Do you want to delete the existing directory (${outputDir}) first?`,
      default: true,
    })
  }

  let spin

  if (shouldClean) {
    const cleanStartTime = performance.now()
    spin = output.spinner('Clean output folder').start()
    await rimraf(outputDir)
    const cleanDuration = performance.now() - cleanStartTime
    spin.text = `Clean output folder (${cleanDuration.toFixed()}ms)`
    spin.succeed()
  }

  spin = output.spinner('Build Sanity Studio').start()

  try {
    // Compile the bundle
    const buildStartTime = performance.now()

    await buildStaticFiles({cwd: workDir, outDir: outputDir})

    const buildDuration = performance.now() - buildStartTime

    spin.text = `Build Sanity Studio (${buildDuration.toFixed()}ms)`
    spin.succeed()
  } catch (err) {
    spin.fail()
    throw err
  }
}

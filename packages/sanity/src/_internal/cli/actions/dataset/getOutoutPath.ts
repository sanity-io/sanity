import fs from 'fs/promises'
import path from 'path'
import {CliPrompter} from '@sanity/cli'
import {noop} from 'rxjs'

// getOutputPath resolves the output path for a CLI command output.
// If outDir is a file path, dir path is created if it does not exists, and final output path is outDir.
// If outDir is a directory path, dir path is created if it does not exists, and
//  final output path is outDir/fileName if fileName is provided otherwise outDir/dataset.tar.gz.
// If overwrite is false, the user is prompted if the file already exists.
async function getOutputPath(
  prompt: CliPrompter,
  dataset: string,
  outDir: string,
  overwrite: boolean,
  defaultFileName?: string,
): Promise<string> {
  if (outDir === '-') {
    return '-'
  }

  const finalOutDir = path.isAbsolute(outDir) ? outDir : path.resolve(process.cwd(), outDir)

  let dstStats = await fs.stat(finalOutDir).catch(noop)

  const looksLikeFile = dstStats
    ? dstStats.isFile()
    : path.basename(finalOutDir).indexOf('.') !== -1

  if (!dstStats) {
    const createPath = looksLikeFile ? path.dirname(finalOutDir) : finalOutDir

    await fs.mkdir(createPath, {recursive: true})
  }

  const finalPath = looksLikeFile
    ? finalOutDir
    : path.join(finalOutDir, defaultFileName || `${dataset}.tar.gz`)
  dstStats = await fs.stat(finalPath).catch(noop)

  if (!overwrite && dstStats && dstStats.isFile()) {
    const shouldOverwrite = await prompt.single({
      type: 'confirm',
      message: `File "${finalPath}" already exists, would you like to overwrite it?`,
      default: false,
    })

    if (!shouldOverwrite) {
      return ''
    }
  }

  return finalPath
}

export default getOutputPath

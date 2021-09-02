import path from 'path'
import fs from 'fs'
import fse from 'fs-extra'
import terser from 'terser'

/**
 * @param {string} inputFile
 */
export default async function (inputFile) {
  const buffer = await fs.promises.readFile(inputFile)
  const outPath = `${inputFile}.min`

  let result
  try {
    result = await terser.minify(buffer.toString(), {
      compress: true,
      mangle: true,
    })
  } catch (e) {
    throw new Error(
      `Failed to minify bundle (${path.basename(inputFile)}):\n\n${e?.message || 'Terser Error'}`
    )
  }

  if (!result?.code) {
    throw new Error(
      `Failed to minify bundle (${path.basename(inputFile)}):\n\n${
        result.error?.message || 'No code output from Terser.'
      }`
    )
  }

  await fs.promises.writeFile(outPath, result.code)

  await fse.unlink(inputFile)
  await fse.move(outPath, inputFile)
}

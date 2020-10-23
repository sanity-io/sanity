import path from 'path'
import execa from 'execa'
import fse from 'fs-extra'
import resolveBin from 'resolve-bin'

export default async (inputFile) => {
  const terserBin = resolveBin.sync('terser')
  if (!terserBin) {
    throw new Error(`Can't find terser binary, cannot compress bundles`)
  }

  const outPath = `${inputFile}.min`
  const {stderr, stdout, code} = await execa(terserBin, ['-c', '-m', '-o', outPath, inputFile])
  if (code > 0) {
    throw new Error(`Failed to minify bundle (${path.basename(inputFile)}):\n\n${stderr || stdout}`)
  }

  await fse.unlink(inputFile)
  await fse.move(outPath, inputFile)
}

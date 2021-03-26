import path from 'path'
import execa from 'execa'
import fse from 'fs-extra'
import resolveBin from 'resolve-bin'

async function minifyTerser(inputFile) {
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

async function minifyEsbuild(inputFile) {
  const esbuildBin = resolveBin.sync('esbuild')
  if (!esbuildBin) {
    throw new Error(`Can't find esbuild binary, cannot compress bundles`)
  }

  const outPath = `${inputFile}.min`
  const {stderr, stdout, code} = await execa(esbuildBin, [
    inputFile,
    '--minify',
    `--outfile=${outPath}`,
  ])
  if (code > 0) {
    throw new Error(`Failed to minify bundle (${path.basename(inputFile)}):\n\n${stderr || stdout}`)
  }

  await fse.unlink(inputFile)
  await fse.move(outPath, inputFile)
}

export default minifyEsbuild

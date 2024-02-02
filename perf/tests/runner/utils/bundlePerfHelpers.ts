import * as esbuild from 'esbuild'

export async function bundle(file: string) {
  const result = await esbuild.build({
    entryPoints: [file],
    bundle: true,
    write: false,
  })
  return result.outputFiles[0].text
}

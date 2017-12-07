import path from 'path'

const datasetUrl = 'https://public.sanity.io/moviesdb.ndjson'
const indent = line => `  ${line}`

export const dependencies = {
  '@sanity/google-maps-input': '^0.99.0',
}

export const generateSanityManifest = base => ({
  ...base,
  plugins: base.plugins.concat(['@sanity/google-maps-input'])
})

export const getSuccessMessage = (opts, context) => {
  const {chalk} = context
  const cwd = process.cwd()
  const inDir = opts.outputDir === cwd
  const cdCmd = inDir ? '' : `cd ${path.relative(cwd, opts.outputDir)}`

  return [
    `${chalk.cyan('Note:')} If you want to import some sample data to your new project, run:`,
    '',
    chalk.cyan(cdCmd),
    chalk.cyan(`sanity dataset import ${datasetUrl} ${opts.dataset}`),
    ''
  ].map(indent).join('\n')
}

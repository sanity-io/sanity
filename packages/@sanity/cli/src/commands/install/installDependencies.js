export default (args, context) => {
  const {output, workDir, yarn} = context
  const {extOptions} = args
  const flags = extOptions.offline ? ['--offline'] : []
  return yarn(['install'].concat(flags), {...output, rootDir: workDir})
}

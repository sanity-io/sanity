export default (args, context) => {
  const {output, workDir, yarn} = context
  return yarn(['install'], {...output, rootDir: workDir})
}

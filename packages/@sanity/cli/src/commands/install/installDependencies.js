import yarnWithProgress from '../../actions/yarn/yarnWithProgress'

export default (args, context) => {
  const {output, workDir} = context
  return yarnWithProgress(['install'], {...output, rootDir: workDir})
}

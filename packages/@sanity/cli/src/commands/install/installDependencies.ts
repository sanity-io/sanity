import type {CliCommandAction} from '../../types'

export const installDependencies: CliCommandAction = (args, context) => {
  const {output, workDir, yarn} = context
  const {extOptions} = args
  const flags = ['--check-files'].concat(extOptions.offline ? ['--offline'] : [])
  return yarn(['install'].concat(flags), {...output, rootDir: workDir})
}

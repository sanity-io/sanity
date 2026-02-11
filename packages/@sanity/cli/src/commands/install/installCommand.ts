import {
  getPackageManagerChoice,
  installDeclaredPackages,
  installNewPackages,
} from '../../packageManager'
import {type CliCommandDefinition} from '../../types'

const installCommand: CliCommandDefinition = {
  name: 'install',
  signature: '',
  helpText: '',
  description: 'Installs dependencies for Sanity Studio project',
  action: async (args, context) => {
    const {workDir, prompt} = context
    const packages = args.argsWithoutOptions

    const pkgManager = await getPackageManagerChoice(workDir, {prompt})

    if (packages.length > 0) {
      await installNewPackages(
        {packageManager: pkgManager.chosen, packages: args.argsWithoutOptions},
        context,
      )
    } else {
      await installDeclaredPackages(workDir, pkgManager.chosen, context)
    }
  },
}

export default installCommand

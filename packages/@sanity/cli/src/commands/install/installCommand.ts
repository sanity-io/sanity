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
    const {workDir, prompt, sanityMajorVersion} = context
    const packages = args.argsWithoutOptions
    if (packages.length > 0 && sanityMajorVersion === 2) {
      /**
       * Note: `@sanity/core` (only used in v2) takes over the `sanity install`
       * command and provides the ability to install plugins. In v3, we don't
       * want this, which is why this error differs based on major version.
       **/
      throw new Error('Re-run this command with `@sanity/core` installed')
    }

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

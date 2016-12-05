import chalk from 'chalk'
import getUserConfig from '../../util/getUserConfig'

export default {
  name: 'logout',
  signature: 'logout',
  description: 'Logs out of the Sanity.io session',
  async action(args, {output, prompt, apiClient}) {
    const cfg = getUserConfig()

    const token = cfg.get('authToken')
    const type = cfg.get('authType')
    if (!token) {
      output.print(chalk.red('No login credentials found'))
      return
    }

    if (token && type !== 'provisional') {
      logout(cfg)
      return
    }

    if (type === 'provisional') {
      output.print(chalk.yellow.inverse('[WARN]') + chalk.yellow(' You are currently logged in as a temporary user!'))
      output.print(chalk.yellow('Logging out will make it super hard to claim your beautiful project :\'('))
    }

    const confirm = await prompt.single({
      type: 'confirm',
      message: 'Are you sure you want to log out?',
      default: false
    })

    if (!confirm) {
      output.print(chalk.red('Aborted'))
      return
    }

    logout(cfg)

    async function logout() {
      const client = apiClient({requireUser: false, requireProject: false})
      if (token) {
        await client.request({uri: '/auth/logout'})
      }

      cfg.del('authType')
      cfg.del('authToken')

      output.print(chalk.green('Logged out'))
    }
  }
}

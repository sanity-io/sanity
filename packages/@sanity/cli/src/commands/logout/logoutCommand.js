import chalk from 'chalk'
import got from 'got'
import getUserConfig from '../../util/getUserConfig'

const baseUrl = 'https://api.sanity.io/v1'
const logoutUrl = `${baseUrl}/auth/logout`

export default {
  name: 'logout',
  command: 'logout',
  describe: 'Logs out of the Sanity.io session',
  async handler({print, error, prompt, spinner}) {
    const cfg = getUserConfig()

    const token = cfg.get('authToken')
    if (token && cfg.get('authType') !== 'provisional') {
      logout(cfg)
      return
    }

    print(chalk.yellow.inverse('[WARN]') + chalk.yellow(' You are currently logged in as a temporary user!'))
    print(chalk.yellow('Logging out will make it super hard to claim your beautiful project :\'('))

    const confirm = await prompt.single({
      type: 'confirm',
      message: 'Are you sure you want to log out?',
      default: false
    })

    if (!confirm) {
      print(chalk.red('Aborted'))
      return
    }

    logout(cfg)

    async function logout() {
      if (token) {
        await got(logoutUrl, {headers: {'Sanity-Token': token}})
      }

      cfg.del('authType')
      cfg.del('authToken')

      print(chalk.green('Logged out'))
    }
  }
}

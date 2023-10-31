import cac from 'cac'

const cli = cac()

/**
 * Command to scaffold playwright
 */
cli.command('init').action(async () => {
  const {initCommand} = await import('./commands/init')

  await initCommand()
})

cli.help()
cli.parse()

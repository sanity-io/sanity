import type {CliCommandDefinition} from '@sanity/cli'
import oneline from 'oneline'
import {createAliasHandler} from './createAliasHandler'
import {deleteAliasHandler} from './deleteAliasHandler'
import {unlinkAliasHandler} from './unlinkAliasHandler'
import {linkAliasHandler} from './linkAliasHandler'

const helpText = `
Below are examples of the alias subcommand

Create Alias
  sanity dataset alias create
  sanity dataset alias create <alias-name>
  sanity dataset alias create <alias-name> <target-dataset>

Delete Alias
  Options
    --force Skips security prompt and forces link command

  Usage
    sanity dataset alias delete <alias-name>
    sanity dataset alias delete <alias-name> --force

Link Alias
  Options
    --force Skips security prompt and forces link command

  Usage
    sanity dataset alias link
    sanity dataset alias link <alias-name>
    sanity dataset alias link <alias-name> <target-dataset>
    sanity dataset alias link <alias-name> <target-dataset> --force

Un-link Alias
  Options
    --force Skips security prompt and forces link command

  Usage
    sanity dataset alias unlink
    sanity dataset alias unlink <alias-name>
    sanity dataset alias unlink <alias-name> --force
`

const aliasCommand: CliCommandDefinition = {
  name: 'alias',
  group: 'dataset',
  signature: 'SUBCOMMAND [ALIAS_NAME, TARGET_DATASET]',
  helpText,
  description: 'You can manage your dataset alias using this command.',
  action: async (args, context) => {
    const [verb] = args.argsWithoutOptions
    switch (verb) {
      case 'create':
        await createAliasHandler(args, context)
        break
      case 'delete':
        await deleteAliasHandler(args, context)
        break
      case 'unlink':
        await unlinkAliasHandler(args, context)
        break
      case 'link':
        await linkAliasHandler(args, context)
        break
      default:
        throw new Error(oneline`
          Invalid command provided. Available commands are: create, delete, link and unlink.
          For more guide run the help command 'sanity dataset alias --help'
        `)
    }
  },
}

export default aliasCommand

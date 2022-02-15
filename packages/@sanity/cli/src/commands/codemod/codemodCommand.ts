import {codemodAction} from '../../actions/codemod/codemodAction'
import type {CliCommandDefinition} from '../../types'

const helpText = `
Runs a given code modification script on the current studio folder.
Running the command without a specified codemod name will list available transformations.

Options
  --dry Dry run (no changes are made to files)
  --extensions=EXT Transform files with these file extensions (comma separated list)
                   (default: js,ts,tsx)
  --no-verify Skips verification steps before running codemod

Examples
  # Show available code mods
  sanity codemod

  # Run codemod to transform react-icons imports from v2 style to v3 style,
  # but only as a dry-run (do not write the files)
  sanity codemod reactIconsV3 --dry

`

const codemodCommand: CliCommandDefinition = {
  name: 'codemod',
  signature: '[CODEMOD_NAME]',
  description: 'Runs a code modification script',
  helpText,
  action: codemodAction,
}

export default codemodCommand

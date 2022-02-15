import type {CliCommandContext} from '../../types'

export interface CodeMod {
  purpose: string
  description: string
  verify?: (context: CliCommandContext) => Promise<void>

  // Must match filename in `cli/codemods/`
  filename: string
}

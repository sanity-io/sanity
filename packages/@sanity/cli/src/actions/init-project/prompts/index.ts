import {CliOutputter, CliPrompter} from '../../../types'

export function promptForTypeScript(prompt: CliPrompter): Promise<boolean> {
  return prompt.single({
    type: 'confirm',
    message: 'Do you want to use TypeScript?',
    default: true,
  })
}

export function promptForDefaultConfig(prompt: CliPrompter): Promise<boolean> {
  return prompt.single({
    type: 'confirm',
    message: 'Use the default dataset configuration?',
    default: true,
  })
}

export function promptImplicitReconfigure(prompt: CliPrompter): Promise<boolean> {
  return prompt.single({
    type: 'confirm',
    message:
      'The current folder contains a configured Sanity studio. Would you like to reconfigure it?',
    default: true,
  })
}

export async function promptForAclMode(prompt: CliPrompter, output: CliOutputter): Promise<string> {
  const mode = await prompt.single({
    type: 'list',
    message: 'Choose dataset visibility – this can be changed later',
    choices: [
      {
        value: 'public',
        name: 'Public (world readable)',
      },
      {
        value: 'private',
        name: 'Private (authenticated requests only)',
      },
    ],
  })

  if (mode === 'private') {
    output.print(
      'Please note that while documents are private, assets (files and images) are still public\n',
    )
  }

  return mode
}

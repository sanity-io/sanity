import {CliPrompter} from '../../../types'

export function promptForEmbeddedStudio(prompt: CliPrompter): Promise<string> {
  return prompt.single({
    type: 'confirm',
    message: `Would you like an embedded Sanity Studio?`,
    default: true,
  })
}

export function promptForAppDir(prompt: CliPrompter): Promise<string> {
  return prompt.single({
    type: 'confirm',
    message: `Would you like to use the Next.js app directory for routes?`,
    default: false,
  })
}

export function promptForStudioPath(prompt: CliPrompter): Promise<string> {
  return prompt.single({
    type: 'input',
    message: 'What route do you want to use for the Studio?',
    default: '/studio',
    validate(input) {
      if (!input.startsWith('/')) {
        return 'Must start with /'
      }

      if (input.endsWith('/')) {
        return 'Must not end with /'
      }

      // a-Z, 0-9, -, _ and /
      if (!/^[a-zA-Z0-9-_\\/]+$/.test(input)) {
        return 'Must only contain a-Z, 0-9, -, _ and /'
      }

      return true
    },
  })
}

export function promptForNextTemplate(prompt: CliPrompter): Promise<'clean' | 'blog'> {
  return prompt.single({
    message: 'Select project template to use',
    type: 'list',
    choices: [
      {
        value: 'clean',
        name: 'Clean project with no predefined schemas',
      },
      {
        value: 'blog',
        name: 'Blog (schema)',
      },
    ],
    default: 'clean',
  })
}

export function promptForAppendEnv(prompt: CliPrompter, envFilename: string): Promise<string> {
  return prompt.single({
    type: 'confirm',
    message: `Would you like to add the project ID and dataset to your ${envFilename} file?`,
    default: true,
  })
}

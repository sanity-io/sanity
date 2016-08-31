import path from 'path'
import validateNpmPackageName from 'validate-npm-package-name'
import isGitUrl from 'is-git-url'

export default function gatherInput(prompt, defaults, {isPlugin} = {}) {
  const thing = isPlugin ? 'Plugin' : 'Project'
  const questions = isPlugin ? [{
    type: 'input',
    name: 'name',
    message: 'Plugin name:',
    default: defaults.projectName || '',
    validate: name => {
      const {validForNewPackages, errors} = validateNpmPackageName(name)
      return validForNewPackages ? true : errors[0]
    }
  }] : []

  questions.push({
    type: 'input',
    name: 'description',
    message: `${thing} description:`,
    default: defaults.description
  }, {
    type: 'input',
    name: 'gitRemote',
    message: 'Git repository URL:',
    default: defaults.gitRemote,
    validate: url => {
      return (url ? isGitUrl(url) : true) || 'Invalid git url'
    }
  }, {
    type: 'input',
    name: 'author',
    message: 'Author:',
    default: defaults.author
  }, {
    type: 'input',
    name: 'license',
    message: 'License:',
    default: 'UNLICENSED'
  })

  if (isPlugin) {
    questions.push({
      type: 'confirm',
      name: 'createConfig',
      message: 'Does the plugin need a configuration file?',
      default: false
    })

    questions.push({
      type: 'input',
      name: 'outputPath',
      message: 'Output path:',
      default: answers => path.join(defaults.rootDir || process.cwd(), 'plugins', answers.name)
    })

    if (defaults.rootDir) {
      questions.push({
        type: 'confirm',
        name: 'addPluginToManifest',
        message: 'Enable plugin in current Sanity installation?',
        default: true
      })
    }
  }

  return prompt(questions)
}

import path from 'path'
import fsp from 'fs-promise'
import validateNpmPackageName from 'validate-npm-package-name'
import isGitUrl from 'is-git-url'

export default async function gatherInput(prompt, defaults, options = {}) {
  const {isPlugin, workDir, sluggedName} = options
  const inProjectContext = workDir !== process.cwd()
  const thing = isPlugin ? 'Plugin' : 'Project'
  const answers = {}

  if (isPlugin) {
    answers.name = await prompt.single({
      type: 'input',
      message: 'Plugin name:',
      default: defaults.projectName || '',
      validate: name => {
        const {validForNewPackages, errors} = validateNpmPackageName(name)
        return validForNewPackages ? true : errors[0]
      }
    })
  }

  answers.description = await prompt.single({
    type: 'input',
    message: `${thing} description:`,
    default: defaults.description
  })

  answers.gitRemote = await prompt.single({
    type: 'input',
    message: 'Git repository URL:',
    default: defaults.gitRemote,
    validate: url => {
      return (url ? isGitUrl(url) : true) || 'Invalid git url'
    }
  })

  answers.author = await prompt.single({
    type: 'input',
    message: 'Author:',
    default: defaults.author
  })

  answers.license = await prompt.single({
    type: 'input',
    message: 'License:',
    default: 'UNLICENSED'
  })

  const workDirIsEmpty = (await fsp.readdir(workDir)).length === 0

  if (!isPlugin && !workDirIsEmpty) {
    answers.outputPath = await prompt.single({
      type: 'input',
      message: 'Output path:',
      default: workDirIsEmpty ? workDir : path.join(workDir, sluggedName),
      validate: validateEmptyPath
    })
  }

  if (isPlugin) {
    answers.outputPath = await prompt.single({
      type: 'input',
      message: 'Output path:',
      default: workDirIsEmpty ? workDir : path.join(workDir, 'plugins', answers.name),
      validate: validateEmptyPath
    })

    answers.createConfig = await prompt.single({
      type: 'confirm',
      message: 'Does the plugin need a configuration file?',
      default: false
    })

    if (inProjectContext) {
      answers.addPluginToManifest = await prompt.single({
        type: 'confirm',
        message: 'Enable plugin in current Sanity installation?',
        default: true
      })
    }
  }

  return answers
}

async function validateEmptyPath(dir) {
  return (await pathIsEmpty(dir))
    ? true
    : 'Given path is not empty'
}

function pathIsEmpty(dir) {
  return fsp.readdir(dir)
    .then(content => content.length === 0)
    .catch(err => {
      if (err.code === 'ENOENT') {
        return true
      }

      throw err
    })
}

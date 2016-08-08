import path from 'path'
import validateNpmPackageName from 'validate-npm-package-name'
import getSlug from 'speakingurl'
import isGitUrl from 'is-git-url'

export default function gatherInput(prompt, defaults, {isPlugin} = {}) {
  const thing = isPlugin ? 'Plugin' : 'Project'
  const questions = [{
    type: 'input',
    name: 'name',
    message: `${thing} name:`,
    default: defaults.projectName || '',
    validate: name => {
      const {validForNewPackages, errors} = validateNpmPackageName(name)
      return validForNewPackages ? true : errors[0]
    }
  }, {
    type: 'input',
    name: 'description',
    message: `${thing} description:`,
    default: defaults.description,
    validate: description => (
      (description || '').length < 1000
      || 'Project descriptions should be less than 1000 characters'
    )
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
  }]

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
      default: answers => path.join(defaults.sanityRoot || process.cwd(), 'plugins', answers.name)
    })

    if (defaults.sanityRoot) {
      questions.push({
        type: 'confirm',
        name: 'addPluginToManifest',
        message: 'Enable plugin in current Sanity installation?',
        default: true
      })
    }
  } else {
    // @todo how do we explain what a dataset is?
    questions.push({
      type: 'input',
      name: 'dataset',
      message: 'Dataset name:',
      default: answers => getSlug(answers.name)
    })
  }

  return prompt(questions)
}

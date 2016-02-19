import validateNpmPackageName from 'validate-npm-package-name'
import isGitUrl from 'is-git-url'

export default function gatherInput(prompt, defaults, {isPlugin} = {}) {
  const questions = [{
    type: 'input',
    name: 'name',
    message: 'Project name:',
    default: defaults.projectName || '',
    validate: name => {
      const {validForNewPackages, errors} = validateNpmPackageName(name)
      return validForNewPackages ? true : errors[0]
    }
  }, {
    type: 'input',
    name: 'description',
    message: 'Project description:',
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
      message: 'Create sample configuration file?',
      default: true
    })
  }

  return prompt(questions)
}

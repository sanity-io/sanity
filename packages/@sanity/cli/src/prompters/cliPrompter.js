import inquirer from 'inquirer'

export default {
  prompt: questions => new Promise(resolve => {
    inquirer.prompt(questions, resolve)
  })
}

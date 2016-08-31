import inquirer from 'inquirer'

export default {prompt}

function prompt(questions) {
  return inquirer.prompt(questions)
}

prompt.Separator = inquirer.Separator
prompt.single = question =>
  prompt([{...question, name: 'value'}]).then(answers => answers.value)

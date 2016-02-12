import inquirer from 'inquirer'
import thenify from 'thenify'

export default {
  prompt: thenify(inquirer.prompt.bind(inquirer))
}

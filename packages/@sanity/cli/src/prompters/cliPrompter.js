import inquirer from 'inquirer'
import thenify from 'thenify'

const prompt = thenify(inquirer.prompt.bind(inquirer))

export default questions => prompt(questions)

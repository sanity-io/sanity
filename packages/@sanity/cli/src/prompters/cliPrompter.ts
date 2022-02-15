import inquirer, {Answers, DistinctQuestion} from 'inquirer'

export function prompt<T extends Answers = Answers>(questions: DistinctQuestion<T>[]): Promise<T> {
  return inquirer.prompt(questions)
}

prompt.Separator = inquirer.Separator
prompt.single = <T = string>(question: DistinctQuestion) =>
  prompt<{value: T}>([{...question, name: 'value'}]).then((answers) => answers.value)

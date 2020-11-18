export default function promptForDataName(prompt, options = {}) {
  return prompt.single({
    type: 'input',
    message: 'Dataset name:',
    ...options
  })
}

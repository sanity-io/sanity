const stringExample = {
  type: 'string',
  name: 'stringExample',
  title: 'String example'
}

const textExample = {
  type: 'text',
  name: 'textExample',
  title: 'Text example'
}

const numberExample = {
  type: 'number',
  name: 'numberExample',
  title: 'Number example'
}

export default {
  type: 'document',
  name: 'allInputs',
  title: 'All inputs',
  fields: [stringExample, textExample, numberExample]
}

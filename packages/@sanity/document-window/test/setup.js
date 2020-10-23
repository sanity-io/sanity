const DocumentWindow = require('../src/DocumentWindow')

const serializeDocWindow = {
  print(val, serialize, indent) {
    const debug = val.debug()
    return [
      '[=== Pre ===]',
      serialize(debug.pre),
      '[=== /Pre ===]',
      '',

      '[=== Window ===]',
      serialize(debug.window),
      '[=== /Window ===]',
      '',

      '[=== Post ===]',
      serialize(debug.post),
      '[=== /Post ===]',
      '',
    ].join('\n')
  },

  test(val) {
    return val && val instanceof DocumentWindow
  },
}

const serializeInjected = {
  print(val, serialize, indent) {
    const newVal = Object.assign({}, val)
    const text = newVal.__injected ? 'INJECTED' : 'UPDATED'
    delete newVal.__injected
    delete newVal.__updated
    const serialized = serialize(newVal).replace(/\n\s\s/g, '\n')
    const wrapped = indent(`\n----[${text}]----\n${serialized}\n---[/${text}]----\n\n`)
    return wrapped
      .replace(/\n\s\s/g, '\n')
      .split('\n')
      .map((line) => line.replace(/\s+$/, ''))
      .join('\n')
  },

  test(val) {
    return val && (val.hasOwnProperty('__injected') || val.hasOwnProperty('__updated'))
  },
}

expect.addSnapshotSerializer(serializeDocWindow)
expect.addSnapshotSerializer(serializeInjected)

function generateOf(num: number) {
  return Array.from(new Array(num)).map((_, idx) => {
    return {
      type: 'object',
      name: `array${idx}`,
      title: `Object #${idx + 1}`,
      fields: [{type: 'string', name: 'title', title: 'Title'}],
    }
  })
}

export default {
  type: 'array',
  name: 'arrayExample1',
  title: 'Array example #1',
  of: generateOf(100),
}

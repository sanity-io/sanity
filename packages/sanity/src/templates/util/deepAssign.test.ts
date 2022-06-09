import deepAssign from './deepAssign'

it('ignores undefined values', () => {
  expect(deepAssign({foo: undefined}, {bar: undefined})).toStrictEqual({
    foo: undefined,
    bar: undefined,
  })
})

it('assigns undefined values from source', () => {
  expect(deepAssign({foo: 'bar', bar: 'hello'}, {foo: undefined})).toStrictEqual({
    foo: undefined,
    bar: 'hello',
  })
})

it('assigns non-undefined values from source', () => {
  expect(deepAssign({foo: undefined}, {bar: 'hello'})).toStrictEqual({foo: undefined, bar: 'hello'})
})

it('merges non-undefined values', () => {
  expect(deepAssign({foo: 'foo'}, {bar: 'bar'})).toStrictEqual({foo: 'foo', bar: 'bar'})
})

it("doesn't merge arrays", () => {
  expect(deepAssign({arr: ['foo']}, {arr: ['bar']})).toStrictEqual({arr: ['bar']})
})

it('merges deep', () => {
  expect(
    deepAssign({some: {deep: {object: true}}}, {some: {deep: {array: ['foo']}}})
  ).toStrictEqual({
    some: {
      deep: {
        array: ['foo'],
        object: true,
      },
    },
  })
})

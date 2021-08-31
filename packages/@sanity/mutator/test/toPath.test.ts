import parse from '../src/jsonpath/parse'
import toPath from '../src/jsonpath/toPath'

const cases = [
  'a.b.c',
  'a.b[5]',
  '[1,2,3]',
  '[1:4]',
  '[count > 5]',
  '..a',
  '[name == "\\"quoted\\""]',
]

cases.forEach((path, i) => {
  test(`case #${i}`, () => {
    expect(path).toEqual(toPath(parse(path)))
  })
})

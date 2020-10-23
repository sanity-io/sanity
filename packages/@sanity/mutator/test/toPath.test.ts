import {test} from 'tap'
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

test((tap) => {
  cases.forEach((path) => {
    tap.same(path, toPath(parse(path)))
  })
  tap.end()
})

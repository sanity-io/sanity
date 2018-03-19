// @flow
import test from './_util/test'
import route from '../src/route'

function mock(obj: Object, methodName: string, mockFn: Function) {
  const original = obj[methodName]
  obj[methodName] = mockFn
  return function restore() {
    obj[methodName] = original
  }
}

test('warn on invalid characters', t => {
  const restore = mock(console, 'error', error => {
    t.equal(error.message, 'Warning: Param segments ":pa`ram" includes invalid characters.')
    restore()
  })
  route('/root/:pa`ram')
})

test('warn on splats', t => {
  const restore = mock(console, 'error', error => {
    t.equal(
      error.message,
      'Warning: Param segments ":pa*ram" includes invalid characters. Splats are not supported. Consider using child routes instead'
    )
    restore()
  })
  route('/root/:pa*ram')
})

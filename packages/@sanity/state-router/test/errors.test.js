// @flow
import test from './_util/test'
import route from '../src/route'

function mock(obj, method, mockFn) {
  const original = obj[method]
  // $FlowIgnore
  obj[method] = mockFn
  return function restore() {
    // $FlowIgnore
    obj[method] = original
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

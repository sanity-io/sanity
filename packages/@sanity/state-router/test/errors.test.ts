import {route} from '../src/route'

function mock(obj: any, methodName: string, mockFn: (...args: any[]) => void) {
  const original = obj[methodName]
  obj[methodName] = mockFn
  return function restore() {
    obj[methodName] = original
  }
}

test('warn on invalid characters', () => {
  const restore = mock(console, 'error', (error) => {
    expect(error.message).toEqual('Warning: Param segments ":pa`ram" includes invalid characters.')
    restore()
  })
  route.create('/root/:pa`ram')
})

test('warn on splats', () => {
  const restore = mock(console, 'error', (error) => {
    expect(error.message).toEqual(
      'Warning: Param segments ":pa*ram" includes invalid characters. Splats are not supported. Consider using child routes instead'
    )
    restore()
  })
  route.create('/root/:pa*ram')
})

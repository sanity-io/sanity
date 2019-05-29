import { HistoryStore as HS } from '../src'

test('works', async () => {
  const result = HS.getHistory(['a'])
  expect(result).toMatch('asdf')
})

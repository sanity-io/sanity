import path from 'path'
import {loadSanityMonorepo} from './sanityMonorepo'

describe('sanityMonorepo', () => {
  it('should load sanity monoporo info', async () => {
    const monorepo = await loadSanityMonorepo(__dirname)

    expect(monorepo?.path).toBe(path.resolve(__dirname, '../../../..'))
  })
})

import path from 'path'
import {loadSanityMonorepo} from '../src/sanityMonorepo'

describe('sanityMonorepo', () => {
  it('should load sanity monorepo info', async () => {
    const monorepo = await loadSanityMonorepo(__dirname)

    expect(monorepo?.path).toBe(path.resolve(__dirname, '../../../..'))
  })
})

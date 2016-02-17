import path from 'path'
import which from 'which'
import {describe, it} from 'mocha'
import getGlobalSanityCliVersion from '../../src/util/getGlobalSanityCliVersion'

const env = process.env // eslint-disable-line no-process-env

describe('getGlobalSanityCliVersion', () => {
  it('returns the correct sanity version from the global CLI tool', () => {
    const binPath = [
      path.resolve(path.join(__dirname, '..', 'fixtures', 'bin', 'version-stub')),
      path.dirname(which.sync('node'))
    ].join(path.delimiter)

    return getGlobalSanityCliVersion({env: Object.assign({}, env, {PATH: binPath})})
      .should.eventually.become('1.3.37')
  })

  it('returns null if no global sanity cli is found', () => {
    return getGlobalSanityCliVersion({env: Object.assign({}, env, {PATH: ''})})
      .should.eventually.become(null)
  })
})

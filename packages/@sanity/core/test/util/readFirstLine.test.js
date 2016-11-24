import path from 'path'
import {expect} from 'chai'
import {describe, it} from 'mocha'
import readFirstLine from '../../src/util/readFirstLine'

const fixturesDir = path.join(__dirname, '..', 'fixtures', 'readFirstLine')

describe('readFirstLine', () => {
  it('reads first line of file if file has multiple short lines', async () => {
    const file = path.join(fixturesDir, 'short-lines.txt')
    const firstLine = await readFirstLine(file)
    expect(firstLine).to.equal('First line')
  })

  it('reads first line of file if file has long lines', async () => {
    const file = path.join(fixturesDir, 'long-line.txt')
    const firstLine = await readFirstLine(file)
    const expectedEnd = 'på en bra måtæ'
    expect(firstLine.indexOf('en 34 år')).to.equal(0)
    expect(firstLine.indexOf(expectedEnd)).to.equal(7238 - expectedEnd.length)
  })

  it('read the only line availabble on single-line files', async () => {
    const file = path.join(fixturesDir, 'no-newline.txt')
    const firstLine = await readFirstLine(file)
    expect(firstLine).to.equal('Just a single line of text')
  })

  it('rejects if file does not exist', () => {
    const file = path.join(fixturesDir, 'non-existant.txt')
    return expect(readFirstLine(file))
      .to.eventually.be.rejectedWith(/ENOENT/)
  })
})

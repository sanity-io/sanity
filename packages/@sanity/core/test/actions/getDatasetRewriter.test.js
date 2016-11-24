import fs from 'fs'
import path from 'path'
import split2 from 'split2'
import {expect} from 'chai'
import {describe, it} from 'mocha'
import getDatasetRewriter from '../../src/actions/dataset/getDatasetRewriter'

const fixturesDir = path.join(__dirname, '..', 'fixtures', 'datasetRewriter')

describe('getDatasetRewriter', () => {
  it('rewrites IDs in document IDs and references if from/to are different', done => {
    const fixture = path.join(fixturesDir, 'manyRefsDocument.ndjson')
    const rewriter = getDatasetRewriter('src', 'target')

    const assertions = [
      doc => {
        expect(doc._id).to.equal('target/someDocumentId')
        expect(doc.category._ref).to.equal('target/123')
        expect(doc.foo.list[1]._ref).to.equal('target/item')
        expect(doc.foo.pop._ref).to.equal('target/789')
        expect(doc.foo.sub.style._ref).to.equal('target/456')
      },
      doc => {
        expect(doc._id).to.equal('target/brewery-1017')
      }
    ]

    let index = 0
    fs.createReadStream(fixture)
      .pipe(split2(JSON.parse))
      .pipe(rewriter)
      .on('data', doc => {
        assertions[index++](doc)

        if (index === assertions.length) {
          done()
        }
      })
  })
})

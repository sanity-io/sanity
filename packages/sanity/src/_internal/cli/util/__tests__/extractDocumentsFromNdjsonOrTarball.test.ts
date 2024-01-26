import fs from 'fs'
import path from 'path'
import {type SanityDocument} from '@sanity/types'
import {extractDocumentsFromNdjsonOrTarball} from '../extractDocumentsFromNdjsonOrTarball'

describe('extractDocumentsFromNdjsonOrTarball', () => {
  it('extracts the contents of a tarball, finds the ndjson file, parses it, and yields each document', async () => {
    // note this archive was created on a mac with the command
    // tar -czvf test-archive.tar.gz data.ndjson
    const readStream = fs.createReadStream(path.resolve(__dirname, './test-archive.tar.gz'))

    const documents: SanityDocument[] = []
    for await (const document of extractDocumentsFromNdjsonOrTarball(readStream)) {
      documents.push(document)
    }
    readStream.close()

    expect(documents).toHaveLength(3)
    const [doc1, doc2, doc3] = documents

    expect(doc1).toEqual({
      _id: 'doc1',
      _type: 'example',
      _rev: 'rev1',
      _createdAt: '2024-01-26T08:10:41.720Z',
      _updatedAt: '2024-01-26T08:10:41.720Z',
    })

    expect(doc2).toEqual({
      _id: 'doc2',
      _type: 'example',
      _rev: 'rev2',
      _createdAt: '2024-01-26T08:10:41.720Z',
      _updatedAt: '2024-01-26T08:10:41.720Z',
    })

    expect(doc3).toEqual({
      _id: 'doc3',
      _type: 'example',
      _rev: 'rev3',
      _createdAt: '2024-01-26T08:10:41.720Z',
      _updatedAt: '2024-01-26T08:10:41.720Z',
    })
  })

  it('accepts an ndjson file, parses it, and yields each document', async () => {
    const readStream = fs.createReadStream(path.resolve(__dirname, './data.ndjson'))

    const documents: SanityDocument[] = []
    for await (const document of extractDocumentsFromNdjsonOrTarball(readStream)) {
      documents.push(document)
    }
    readStream.close()

    expect(documents).toHaveLength(3)
    const [doc1, doc2, doc3] = documents

    expect(doc1).toEqual({
      _id: 'doc1',
      _type: 'example',
      _rev: 'rev1',
      _createdAt: '2024-01-26T08:10:41.720Z',
      _updatedAt: '2024-01-26T08:10:41.720Z',
    })

    expect(doc2).toEqual({
      _id: 'doc2',
      _type: 'example',
      _rev: 'rev2',
      _createdAt: '2024-01-26T08:10:41.720Z',
      _updatedAt: '2024-01-26T08:10:41.720Z',
    })

    expect(doc3).toEqual({
      _id: 'doc3',
      _type: 'example',
      _rev: 'rev3',
      _createdAt: '2024-01-26T08:10:41.720Z',
      _updatedAt: '2024-01-26T08:10:41.720Z',
    })
  })
})

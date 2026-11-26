import {describe, expect, it} from 'vitest'

import {functionId, GROQ_FUNCTIONS} from './groqFunctionReference'
import {buildGroqReference, canUseSemanticSearch, listGroqFunctions} from './groqReference'

const withEmbeddings = buildGroqReference({embeddings: true, apiVersion: 'v2025-02-19'})
const withoutEmbeddings = buildGroqReference({embeddings: false, apiVersion: 'v2025-02-19'})

describe('buildGroqReference', () => {
  it.each([
    ['keyword scoring with match', 'title match text::query($terms)'],
    ['dropping documents that match nothing', '[_score > 0]'],
    ['scoring before slicing', 'Score, then order, then slice'],
    ['weighing conditions', 'boost(title match text::query($terms), 3)'],
    ['following and finding references', 'references(*[_type == "genre" && title in $genres]._id)'],
    ['plain text of Portable Text', 'pt::text(body)'],
    ['quoted keys', '@["release-year"]'],
    ['base IDs under the published and drafts perspectives', 'under its base ID'],
    ['drafts. prefixes only with raw', 'Only with raw are drafts'],
    ['the release name for partOfRelease', "taking the release's name, never its _id"],
    ['versions that change a document', '_system.base'],
    ['ranking by how often a document is referenced', 'order(movieCount desc)'],
    ['choosing how to search', 'Choosing how to find documents'],
    ['expanding search terms', 'Expanding search terms'],
    ['that only score() and order() are piped', 'Only score() and order() go after a pipe'],
    ['that there is no GROUP BY', 'There is no GROUP BY'],
    ['not filtering after ->', 'Never filter what -> returns'],
    [
      'not reading a computed attribute in its own projection',
      'not available elsewhere in the same projection',
    ],
    ['paging by _id', '_id > $lastId'],
  ])('teaches %s on every dataset', (_, text) => {
    expect(withEmbeddings).toContain(text)
    expect(withoutEmbeddings).toContain(text)
  })

  it('teaches semantic and hybrid search only with embeddings', () => {
    expect(withEmbeddings).toContain('score(text::semanticSimilarity($description))')
    expect(withEmbeddings).toContain('Hybrid search')
    expect(withEmbeddings).toContain('It only works inside score()')

    expect(withoutEmbeddings).not.toContain('text::semanticSimilarity($')
    expect(withoutEmbeddings).not.toContain('Hybrid search')
    expect(withoutEmbeddings).toContain('never use it')
  })

  it('lists every function the query can call, from the function reference', () => {
    const reference = buildGroqReference({embeddings: true, apiVersion: 'vX'})
    for (const doc of GROQ_FUNCTIONS) {
      if (doc.deltaOnly) {
        expect(reference).not.toContain(doc.signature)
      } else {
        expect(reference).toContain(`- ${doc.signature}`)
      }
    }
    expect(reference).toContain('- order(<expression> [asc|desc], ...) (after |)')
    expect(reference).toContain('- boost(<expression>, <number>) (only inside score())')
  })

  it('leaves out functions newer than the API version, and the releases they need', () => {
    const reference = buildGroqReference({embeddings: true, apiVersion: 'v2021-10-21'})

    expect(reference).not.toContain('sanity::partOfRelease')
    expect(reference).not.toContain('text::highlight')
    expect(reference).toContain('pt::text(<Portable Text array|object>) <string>')
    expect(buildGroqReference({embeddings: true, apiVersion: 'vX'})).toContain('text::highlight')
  })

  it('names the perspective the query runs with', () => {
    expect(buildGroqReference({embeddings: false, perspective: 'published'})).toContain(
      'The query runs with the published perspective',
    )
    expect(buildGroqReference({embeddings: false, perspective: ['rSummer', 'drafts']})).toContain(
      'The query runs with a stack of releases (rSummer, drafts)',
    )
    expect(withoutEmbeddings).not.toContain('The query runs with')
  })
})

describe('listGroqFunctions', () => {
  it('keeps semanticSimilarity out unless the dataset has embeddings', () => {
    const ids = (embeddings: boolean) => listGroqFunctions({embeddings}).map(functionId)

    expect(ids(true)).toContain('text::semanticSimilarity')
    expect(ids(false)).not.toContain('text::semanticSimilarity')
    expect(ids(false)).toContain('text::query')
  })
})

describe('canUseSemanticSearch', () => {
  it('needs embeddings and an API version with namespaced functions', () => {
    expect(canUseSemanticSearch({embeddings: true, apiVersion: 'v2025-02-19'})).toBe(true)
    expect(canUseSemanticSearch({embeddings: true, apiVersion: 'vX'})).toBe(true)
    expect(canUseSemanticSearch({embeddings: true})).toBe(true)
    expect(canUseSemanticSearch({embeddings: true, apiVersion: 'v1'})).toBe(false)
    expect(canUseSemanticSearch({embeddings: false, apiVersion: 'vX'})).toBe(false)
  })
})

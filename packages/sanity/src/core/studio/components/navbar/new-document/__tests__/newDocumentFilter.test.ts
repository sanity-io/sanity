import {startCase} from 'lodash'
import {filterOptions} from '../filter'
import {NewDocumentOption} from '../types'

const createNewDocumentOption = (name: string): NewDocumentOption => ({
  id: name,
  title: startCase(name),
  templateId: name,
  hasPermission: true,
  schemaType: name,
  type: 'initialValueTemplateItem',
})

describe('core: New document filter', () => {
  // This test checks that the result is filtered based on the query.
  it('should filter out options that do not match the query', () => {
    const author = createNewDocumentOption('author')
    const article = createNewDocumentOption('article')
    const book = createNewDocumentOption('book')
    const category = createNewDocumentOption('category')

    const searchQuery = 'article'
    const options = [article, author, book, category]

    const result = filterOptions(options, searchQuery, (i) => i)

    expect(result).toEqual([article])
  })

  // This tests checks that all the results are returned when the query is empty.
  it('should return the correct result when the query is empty', () => {
    const author = createNewDocumentOption('author')
    const article = createNewDocumentOption('article')
    const book = createNewDocumentOption('book')
    const category = createNewDocumentOption('category')

    const searchQuery = ''
    const options = [article, author, book, category]

    const result = filterOptions(options, searchQuery, (i) => i)
    expect(result).toEqual([article, author, book, category])
  })

  // This test checks that no results are returned when the query is not found.
  it('should return the correct result when the query is not found', () => {
    const author = createNewDocumentOption('author')
    const article = createNewDocumentOption('article')
    const book = createNewDocumentOption('book')
    const category = createNewDocumentOption('category')

    const searchQuery = 'foo'
    const options = [article, author, book, category]

    const result = filterOptions(options, searchQuery, (i) => i)
    expect(result).toEqual([])
  })

  // This test checks that the result is sorted based on relevance.
  // The result should be sorted based on the following criteria:
  // 1. If the title starts with the query, it should be first
  // 2. If the title contains the query, it should be second
  it('should sort the result based on relevance', () => {
    const withAuthor = createNewDocumentOption('withAuthor')
    const withBook = createNewDocumentOption('withBook')
    const withAuthorAndBook = createNewDocumentOption('withAuthorAndBook')
    const bookWithAuthor = createNewDocumentOption('bookWithAuthor')
    const book = createNewDocumentOption('book')

    const searchQuery = 'with'
    const options = [withAuthor, withBook, withAuthorAndBook, bookWithAuthor, book]

    const result = filterOptions(options, searchQuery, (i) => i)
    expect(result).toEqual([withAuthor, withAuthorAndBook, withBook, bookWithAuthor])
  })
})

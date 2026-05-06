import {describe, expect, it} from 'vitest'

import {createMockDocumentOperationArgs, createSnapshot} from '../__tests__/operationTestUtils'
import {patch} from './patch'

describe('patch', () => {
  it('is never disabled', () => {
    expect(patch.disabled(createMockDocumentOperationArgs())).toBe(false)
  })

  it('mutates the existing document with a guard patch and the requested patches', () => {
    const args = createMockDocumentOperationArgs({
      snapshot: createSnapshot(),
    })

    patch.execute(args, [{set: {title: 'Aliens'}}])

    expect(args.document.patch).toHaveBeenNthCalledWith(1, [{set: {title: 'Aliens'}}])
    expect(args.document.patch).toHaveBeenNthCalledWith(2, [
      {unset: ['_empty_action_guard_pseudo_field_']},
    ])
    expect(args.document.mutate).toHaveBeenCalledWith([
      {patch: {id: 'drafts.example-id', unset: ['_empty_action_guard_pseudo_field_']}},
      {patch: {id: 'drafts.example-id', set: {title: 'Aliens'}}},
    ])
    expect(args.document.commit).not.toHaveBeenCalled()
  })

  it('creates from the published document before patching when no snapshot exists', () => {
    const args = createMockDocumentOperationArgs({snapshot: null})

    patch.execute(args, [{set: {title: 'Aliens'}}], {title: 'Alien'})

    expect(args.document.createIfNotExists).toHaveBeenCalledWith({
      _id: 'drafts.example-id',
      _type: 'movie',
      title: 'Alien',
    })
    expect(args.document.create).not.toHaveBeenCalled()
    expect(args.document.mutate).toHaveBeenNthCalledWith(1, [
      {createIfNotExists: {_id: 'drafts.example-id', _type: 'movie', title: 'Alien'}},
    ])
    expect(args.document.commit).toHaveBeenCalledTimes(1)
    expect(args.document.mutate).toHaveBeenNthCalledWith(2, [
      {patch: {id: 'drafts.example-id', set: {title: 'Aliens'}}},
    ])
  })

  it('creates a new document before patching when no published document exists', () => {
    const args = createMockDocumentOperationArgs({
      publishedId: undefined,
      snapshot: null,
    })

    patch.execute(args, [{set: {title: 'Aliens'}}], {title: 'Alien'})

    expect(args.document.create).toHaveBeenCalledWith({
      _id: 'drafts.example-id',
      _type: 'movie',
      title: 'Alien',
    })
    expect(args.document.createIfNotExists).not.toHaveBeenCalled()
    expect(args.document.mutate).toHaveBeenNthCalledWith(1, [
      {create: {_id: 'drafts.example-id', _type: 'movie', title: 'Alien'}},
    ])
    expect(args.document.commit).toHaveBeenCalledTimes(1)
    expect(args.document.mutate).toHaveBeenNthCalledWith(2, [
      {patch: {id: 'drafts.example-id', set: {title: 'Aliens'}}},
    ])
  })
})

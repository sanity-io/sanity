import {SanityClient} from '@sanity/client'
import {validationMarkerCodes} from '@sanity/validation'
import {expect, it, vi} from 'vitest'

import {getFallbackLocaleSource} from '../i18n/fallback'
import {createSchema} from '../schema/createSchema'
import {validateDocument} from './index'

it('keeps target type checks opt-in for the Studio validation export', async () => {
  const request = vi.fn(async () => ({result: [{_id: 'target', _type: 'movie'}]}))
  const client = new SanityClient(request, {
    projectId: 'project',
    dataset: 'production',
    apiVersion: '2025-02-19',
    useCdn: false,
  })
  const schema = createSchema({
    name: 'test',
    types: [
      {name: 'actor', type: 'document', fields: [{name: 'name', type: 'string'}]},
      {
        name: 'movie',
        type: 'document',
        fields: [{name: 'actor', type: 'reference', to: [{type: 'actor'}]}],
      },
    ],
  })
  const options = {
    workspace: {schema, getClient: () => client, i18n: getFallbackLocaleSource()},
    document: {
      _id: 'movie',
      _type: 'movie',
      _rev: 'rev',
      _createdAt: '',
      _updatedAt: '',
      actor: {_type: 'reference', _ref: 'target'},
    },
    getDocumentExists: async () => true,
  }
  await expect(validateDocument(options)).resolves.toEqual([])
  await expect(validateDocument({...options, validateReferenceTypes: undefined})).resolves.toEqual(
    [],
  )
  expect(request).not.toHaveBeenCalled()
  await expect(validateDocument({...options, validateReferenceTypes: true})).resolves.toEqual([
    expect.objectContaining({
      code: validationMarkerCodes.referenceTargetTypeMismatch,
      path: ['actor'],
    }),
  ])
  expect(request).toHaveBeenCalledOnce()
})

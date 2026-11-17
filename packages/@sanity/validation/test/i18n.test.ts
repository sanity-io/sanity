import {createClient} from '@sanity/client'
import {Schema as SchemaBuilder} from '@sanity/schema'
import {builtinTypes} from '@sanity/schema/_internal'
import {type Rule, type SanityDocument} from '@sanity/types'
import {createInstance} from 'i18next'
import {describe, expect, it} from 'vitest'

import {validateDocument, validateDocuments, type ValidationLocaleSource} from '../src'
import {inferFromSchema} from '../src/_internal'

const builtinSchema = inferFromSchema(SchemaBuilder.compile({name: 'studio', types: builtinTypes}))
const schema = inferFromSchema(
  SchemaBuilder.compile({
    name: 'test',
    parent: builtinSchema,
    types: [
      {
        name: 'article',
        type: 'document',
        fields: [
          {name: 'title', type: 'string', validation: (rule: Rule) => rule.required()},
          {
            name: 'summary',
            type: 'string',
            validation: (rule: Rule) =>
              rule.custom(async (value, context) => {
                await context.i18n.loadNamespaces(['custom-validation'])
                return value ? true : context.i18n.t('custom-validation:summary-required')
              }),
          },
          {
            name: 'name',
            type: 'string',
            validation: (rule: Rule) =>
              rule.required().error({'en-US': 'Name is required', 'nb-NO': 'Navn er påkrevd'}),
          },
        ],
      },
    ],
  }),
)
const client = createClient({
  projectId: 'test-project',
  dataset: 'test',
  useCdn: false,
  apiVersion: '2025-02-19',
})
const document: SanityDocument = {
  _id: 'article',
  _type: 'article',
  _rev: 'rev',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
}

describe.each(['validateDocument', 'validateDocuments'] as const)('%s translations', (api) => {
  it.each([
    {
      locale: 'en-US',
      required: 'Please enter a title',
      summary: 'Please enter a summary',
      name: 'Name is required',
    },
    {
      locale: 'nb-NO',
      required: 'Skriv inn en tittel',
      summary: 'Skriv inn et sammendrag',
      name: 'Navn er påkrevd',
    },
  ])(
    'uses supplied translation resources and locale ($locale)',
    async ({locale, required, summary, name}) => {
      const instance = createInstance()
      await instance.init({
        lng: locale,
        fallbackLng: false,
        ns: ['validation'],
        resources: {
          [locale]: {
            'validation': {'generic.required': required},
            'custom-validation': {'summary-required': summary},
          },
        },
      })
      const i18n: ValidationLocaleSource = {
        currentLocale: {id: locale},
        loadNamespaces: (namespaces) => instance.loadNamespaces(namespaces),
        t: instance.t,
      }
      const options = {client, schema, i18n}
      const documents = [document, {...document, _id: 'unknown', _type: 'unknown'}]
      const results =
        api === 'validateDocument'
          ? await Promise.all(documents.map((doc) => validateDocument({...options, document: doc})))
          : await validateDocuments({...options, documents})

      expect(results[0]).toMatchObject({
        complete: true,
        markers: expect.arrayContaining([
          expect.objectContaining({message: required, path: ['title']}),
          expect.objectContaining({message: summary, path: ['summary']}),
          expect.objectContaining({message: name, path: ['name']}),
        ]),
      })
      expect(results[1]).toMatchObject({complete: false})
    },
  )

  it('uses built-in English translations when i18n is omitted', async () => {
    const options = {client, schema}
    const result =
      api === 'validateDocument'
        ? await validateDocument({...options, document})
        : (await validateDocuments({...options, documents: [document]}))[0]

    expect(result).toMatchObject({
      complete: true,
      markers: expect.arrayContaining([
        expect.objectContaining({message: 'Required', path: ['title']}),
        expect.objectContaining({message: 'Name is required', path: ['name']}),
      ]),
    })
  })
})

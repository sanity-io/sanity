import {defineSingleton, type UnresolvedSingletonDefinition} from 'sanity'

export const singletons: UnresolvedSingletonDefinition[] = [
  // String shorthand: id === documentId === schemaType.
  'singletonSettings',
  // Two singletons sharing the `singletonCampaign` schema type. The
  // definition `id` is omitted, so it inherits each `documentId`.
  defineSingleton({
    documentId: 'springCampaign',
    schemaType: 'singletonCampaign',
    title: 'Spring campaign',
    initialValue: {
      headline: 'Spring 🌱',
    },
  }),
  defineSingleton({
    documentId: 'summerCampaign',
    schemaType: 'singletonCampaign',
    title: 'Summer campaign',
    initialValue: {
      headline: 'Summer 🌞',
    },
  }),
  defineSingleton({
    id: 'validation',
    documentId: 'validation',
    schemaType: 'allTypes',
    // Without a title, the list item would inherit the schema type's
    // ("All schema types").
    title: 'Validation',
  }),
  defineSingleton({
    documentId: 'circular',
    schemaType: 'referenceTest',
  }),
  defineSingleton({
    documentId: 'grrm',
    schemaType: 'author',
    title: 'GRRM',
  }),
  defineSingleton({
    documentId: 'jrr-tolkien',
    schemaType: 'author',
    title: 'JRR Tolkien',
  }),
]

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
  }),
  defineSingleton({
    documentId: 'summerCampaign',
    schemaType: 'singletonCampaign',
    title: 'Summer campaign',
  }),
  defineSingleton({
    id: 'validation',
    documentId: 'validation',
    schemaType: 'allTypes',
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

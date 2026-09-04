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
]

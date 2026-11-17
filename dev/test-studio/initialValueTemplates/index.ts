import {type ClientConfig, type SanityClient} from '@sanity/client'
import {CogIcon} from '@sanity/icons/Cog'
import {RocketIcon} from '@sanity/icons/Rocket'
import {type Template} from 'sanity'

import author from '../schema/author'

export const resolveInitialValueTemplates: Template[] = [
  // `author` and `referenceTest` back singleton definitions, so their
  // plain per-type templates are replaced by singleton-tagged templates,
  // which are never offered as "create new" options. These explicit untagged
  // templates utilise the documented escape hatch: they allow non-signleton
  // documents of the shared schema types to be created.
  {
    id: 'author-non-singleton',
    title: 'Author',
    schemaType: 'author',
    value: author.initialValue,
  },
  {
    id: 'referenceTest-non-singleton',
    title: 'Reference test',
    schemaType: 'referenceTest',
    value: {},
  },
  {
    id: 'author-developer',
    title: 'Developer',
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    description: `Selects the role "Developer" for you, so you don't have to`,
    schemaType: 'author',
    icon: CogIcon,
    value: () => ({role: 'developer'}),
  },
  {
    id: 'author-unlocked',
    title: 'Author unlocked',
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    description: 'An unlocked author',
    schemaType: 'author',
    icon: RocketIcon,
    value: {locked: false},
  },
  {
    id: 'client-error-test',
    title: 'Author, but client error',
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    description: 'An unlocked author',
    schemaType: 'author',
    icon: RocketIcon,
    value: async (params: any, ctx: {getClient(cfg: ClientConfig): SanityClient}) => {
      const client = ctx.getClient({apiVersion: 'v2026-06-24'})
      // add a syntax error to trigger a 4xx
      return client.fetch('{}')
    },
  },
  {
    id: 'book-by-author',
    title: 'Book by author',
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    description: 'Book by a specific author',
    schemaType: 'book',
    parameters: [{name: 'authorId', type: 'string'}],
    value: (params: any) => ({
      author: {_type: 'reference', _ref: params?.authorId},
    }),
  },
]

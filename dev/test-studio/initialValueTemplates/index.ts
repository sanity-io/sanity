import {type ClientConfig, type SanityClient} from '@sanity/client'
import {CogIcon} from '@sanity/icons/Cog'
import {RocketIcon} from '@sanity/icons/Rocket'
import {type Template} from 'sanity'

export const resolveInitialValueTemplates: Template[] = [
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

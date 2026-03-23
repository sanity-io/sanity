import {type SanityClient} from '@sanity/client'
import {type InitialValueResolverContext, type Schema} from '@sanity/types'
import {firstValueFrom} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {createSchema} from '../../../../schema/createSchema'
import {defaultTemplatesForSchema, prepareTemplates} from '../../../../templates/prepare'
import {requiresApproval} from '../debug/exampleGrants'
import {createGrantsStore} from '../grantsStore'
import {getTemplatePermissions} from '../templatePermissions'

const schema = createSchema({
  name: 'test',
  types: [
    {
      name: 'author',
      title: 'Author',
      type: 'document',
      fields: [
        {name: 'name', type: 'string'},
        {name: 'role', type: 'string'},
        {name: 'locked', type: 'boolean'},
      ],
    },
  ],
})

const templates = prepareTemplates(schema, [
  ...defaultTemplatesForSchema(schema),
  {
    id: 'author-developer-locked',
    title: 'Developer',
    schemaType: 'author',
    value: {role: 'developer', locked: true},
  },
  {
    id: 'author-developer-unlocked',
    title: 'Developer',
    schemaType: 'author',
    value: {role: 'developer', locked: false},
  },
])

describe('getTemplatePermissions', () => {
  it('takes in a list of `InitialValueTemplateItem`s and returns an observable of `TemplatePermissionsResult` in a record', async () => {
    const client = createMockSanityClient({requests: {'/acl': requiresApproval}})
    const grantsStore = createGrantsStore({
      client: client as unknown as SanityClient,
      userId: null,
    })

    const context: InitialValueResolverContext = {
      projectId: 'test-project',
      dataset: 'test-dataset',
      schema: schema as Schema,
      currentUser: null,
      getClient: () => client as unknown as SanityClient,
    }

    const permissions = firstValueFrom(
      getTemplatePermissions({
        grantsStore,
        schema,
        templates,
        templateItems: [
          {
            id: 'author-developer-locked',
            templateId: 'author-developer-locked',
            type: 'initialValueTemplateItem',
            schemaType: 'author',
            parameters: {},
          },
          {
            id: 'author-developer-unlocked',
            templateId: 'author-developer-unlocked',
            type: 'initialValueTemplateItem',
            schemaType: 'author',
            parameters: {},
          },
        ],
        context,
      }),
    )

    await expect(permissions).resolves.toEqual([
      {
        description: undefined,
        granted: false,
        icon: undefined,
        i18n: undefined,
        schemaType: 'author',
        id: 'author-developer-locked',
        reason: 'No matching grants found',
        resolvedInitialValue: {locked: true, role: 'developer'},
        subtitle: 'Author',
        template: {
          id: 'author-developer-locked',
          schemaType: 'author',
          title: 'Developer',
          value: {locked: true, role: 'developer'},
        },
        templateId: 'author-developer-locked',
        title: 'Developer',
        type: 'initialValueTemplateItem',
        parameters: {},
      },
      {
        description: undefined,
        granted: true,
        icon: undefined,
        i18n: undefined,
        schemaType: 'author',
        id: 'author-developer-unlocked',
        reason: 'Matching grant',
        resolvedInitialValue: {locked: false, role: 'developer'},
        subtitle: 'Author',
        template: {
          id: 'author-developer-unlocked',
          schemaType: 'author',
          title: 'Developer',
          value: {locked: false, role: 'developer'},
        },
        templateId: 'author-developer-unlocked',
        title: 'Developer',
        type: 'initialValueTemplateItem',
        parameters: {},
      },
    ])
  })
})

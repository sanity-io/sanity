import {type SanityClient} from '@sanity/client'
import {type InitialValueResolverContext, type Schema} from '@sanity/types'
import {firstValueFrom} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {createSchema} from '../../../schema'
import {defaultTemplatesForSchema, prepareTemplates} from '../../../templates'
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
  {
    id: 'author-resolver-throws',
    title: 'Throws',
    schemaType: 'author',
    // A resolver that rejects (e.g. its `client.fetch` network-errored).
    value: () => Promise.reject(new Error('resolver boom')),
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

    const permissions = await firstValueFrom(
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

    // Resolution is concurrent, so sort by id for a stable comparison.
    const sorted = [...permissions].sort((a, b) => a.id.localeCompare(b.id))

    expect(sorted).toEqual([
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

  it('keeps templates whose initial value fails to resolve, with an empty resolved value, instead of erroring or dropping', async () => {
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

    const permissions = await firstValueFrom(
      getTemplatePermissions({
        grantsStore,
        schema,
        templates,
        templateItems: [
          {
            id: 'author-resolver-throws',
            templateId: 'author-resolver-throws',
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

    // Both templates are present (rather than the stream erroring / never
    // emitting, which would leave the create menu stuck loading). The failing
    // one falls back to an empty resolved initial value so it stays
    // clickable; the editor surfaces the real error on navigate.
    const byId = Object.fromEntries(permissions.map((permission) => [permission.id, permission]))
    expect(Object.keys(byId).sort()).toEqual([
      'author-developer-unlocked',
      'author-resolver-throws',
    ])
    expect(byId['author-resolver-throws'].resolvedInitialValue).toEqual({})
  })

  it('does not get stuck (emits) when every template fails to resolve', async () => {
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

    const permissions = await firstValueFrom(
      getTemplatePermissions({
        grantsStore,
        schema,
        templates,
        templateItems: [
          {
            id: 'author-resolver-throws',
            templateId: 'author-resolver-throws',
            type: 'initialValueTemplateItem',
            schemaType: 'author',
            parameters: {},
          },
        ],
        context,
      }),
    )

    // It emits (doesn't hang): the single failing template is kept with an
    // empty resolved value rather than dropped.
    expect(permissions.map((permission) => permission.id)).toEqual(['author-resolver-throws'])
    expect(permissions[0].resolvedInitialValue).toEqual({})
  })
})

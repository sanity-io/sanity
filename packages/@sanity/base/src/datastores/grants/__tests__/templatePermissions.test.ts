/* eslint-disable camelcase */

import {first} from 'rxjs/operators'
// import {createStructureBuilder} from '../../../../structure'
import {prepareTemplates, defaultTemplatesForSchema} from '../../../templates'
import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createAuthController} from '../../../auth'
import {createSchema} from '../../../schema'
import {createAuthStore} from '../../authState'
import {__tmp_crossWindowMessaging} from '../../crossWindowMessaging'
import {createUserStore} from '../../user'
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
    const authenticationFetcher = createAuthController({client: client as any})
    const crossWindowMessaging = __tmp_crossWindowMessaging({projectId: 'test'})
    const authStore = createAuthStore({crossWindowMessaging, projectId: 'test'})
    const userStore = createUserStore({
      authStore,
      client: client as any,
      authController: authenticationFetcher,
      projectId: 'foo',
    })
    const grantsStore = createGrantsStore(client as any, userStore)

    const permissions = getTemplatePermissions({
      grantsStore,
      schema,
      templates,
      templateItems: [
        {
          id: 'author-developer-locked',
          templateId: 'author-developer-locked',
          type: 'initialValueTemplateItem',
          schemaType: 'author',
        },
        {
          id: 'author-developer-unlocked',
          templateId: 'author-developer-unlocked',
          type: 'initialValueTemplateItem',
          schemaType: 'author',
        },
      ],
    })
      .pipe(first())
      .toPromise()

    await expect(permissions).resolves.toEqual([
      {
        description: undefined,
        granted: false,
        icon: undefined,
        id: 'author-developer-locked',
        parameters: undefined,
        reason: 'No matching grants found',
        resolvedInitialValue: {locked: true, role: 'developer'},
        subtitle: 'Author',
        template: {
          description: undefined,
          icon: undefined,
          id: 'author-developer-locked',
          parameters: undefined,
          schemaType: 'author',
          title: 'Developer',
          value: {locked: true, role: 'developer'},
        },
        templateId: 'author-developer-locked',
        title: 'Developer',
        type: 'initialValueTemplateItem',
      },
      {
        description: undefined,
        granted: true,
        icon: undefined,
        id: 'author-developer-unlocked',
        parameters: undefined,
        reason: 'Matching grant',
        resolvedInitialValue: {locked: false, role: 'developer'},
        subtitle: 'Author',
        template: {
          description: undefined,
          icon: undefined,
          id: 'author-developer-unlocked',
          parameters: undefined,
          schemaType: 'author',
          title: 'Developer',
          value: {locked: false, role: 'developer'},
        },
        templateId: 'author-developer-unlocked',
        title: 'Developer',
        type: 'initialValueTemplateItem',
      },
    ])
  })
})

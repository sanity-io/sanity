/* eslint-disable camelcase */

import {prepareTemplates, T} from '@sanity/initial-value-templates'
import {createStructureBuilder} from '@sanity/structure'
import {first} from 'rxjs/operators'
import {createMockSanityClient} from '../../../test/mocks/mockSanityClient'
import {createAuthController} from '../../auth/authController'
import {createSchema} from '../../schema'
import {createAuthStore} from '../authState'
import {__tmp_crossWindowMessaging} from '../crossWindowMessaging'
import {createUserStore} from '../user'
import {requiresApproval} from './debug/exampleGrants'
import {createGrantsStore} from './grantsStore'
import {unstable_getTemplatePermissions as getTemplatePermissions} from './templatePermissions'

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

const initialValueTemplates = prepareTemplates(schema, [
  ...T.defaults(schema),
  T.template({
    id: 'author-developer-locked',
    title: 'Developer',
    schemaType: 'author',
    value: {role: 'developer', locked: true},
  }),
  T.template({
    id: 'author-developer-unlocked',
    title: 'Developer',
    schemaType: 'author',
    value: {role: 'developer', locked: false},
  }),
])

describe('getTemplatePermissions', () => {
  it('takes in a list of `InitialValueTemplateItem`s and returns an observable of `TemplatePermissionsResult` in a record', async () => {
    const client = createMockSanityClient({requests: {'/acl': requiresApproval}})
    const authenticationFetcher = createAuthController({client: client as any})
    const crossWindowMessaging = __tmp_crossWindowMessaging({projectId: 'test'})
    const authStore = createAuthStore({crossWindowMessaging, projectId: 'test'})
    const userStore = createUserStore({
      authStore,
      sanityClient: client as any,
      authenticationFetcher,
      projectId: 'foo',
    })
    const grantsStore = createGrantsStore(client as any, userStore)
    const S = createStructureBuilder({initialValueTemplates, schema} as any)

    const permissions = getTemplatePermissions(grantsStore, schema, initialValueTemplates, [
      S.initialValueTemplateItem('author-developer-locked'),
      S.initialValueTemplateItem('author-developer-unlocked'),
    ])
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

import {first} from 'rxjs/operators'
import S from '../../_exports/structure-builder'
import {unstable_getTemplatePermissions as getTemplatePermissions} from './templatePermissions'

jest.mock('part:@sanity/base/schema', () => {
  const createSchema = jest.requireActual('part:@sanity/base/schema-creator')
  return createSchema({
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
})

jest.mock('part:@sanity/base/initial-value-templates?', () => {
  const {TemplateBuilder: T} = require('@sanity/initial-value-templates')

  return [
    ...T.defaults(),
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
  ]
})

jest.mock('part:@sanity/base/client', () => {
  const exampleGrants = require('./debug/exampleGrants')
  const mockConfig = {
    useCdn: false,
    projectId: 'mock-project-id',
    dataset: 'mock-data-set',
    apiVersion: '1',
  }

  const mockClient = {
    config: () => mockConfig,
    withConfig: () => mockClient,
    request: jest.fn(() => Promise.resolve(exampleGrants.requiresApproval)),
  }

  return mockClient
})

describe('getTemplatePermissions', () => {
  it('takes in a list of `InitialValueTemplateItem`s and returns an observable of `TemplatePermissionsResult` in a record', async () => {
    const permissions = getTemplatePermissions([
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

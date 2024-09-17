import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {
  type CurrentUser,
  defineField,
  defineType,
  isIndexTuple,
  isKeySegment,
  type ObjectSchemaType,
  type Path,
} from '@sanity/types'
import {startsWith, toString} from '@sanity/util/paths'

import {createSchema} from '../../../schema/createSchema'
import {
  createPrepareFormState,
  type PrepareFormState,
  type RootFormStateOptions,
} from '../formState'
import {type FieldsetState} from '../types/fieldsetState'
import {
  type ArrayOfObjectsItemMember,
  type ArrayOfPrimitivesItemMember,
  type FieldMember,
} from '../types/members'
import {
  type ArrayOfObjectsFormNode,
  type ArrayOfPrimitivesFormNode,
  type ObjectFormNode,
  type PrimitiveFormNode,
} from '../types/nodes'
import {type StateTree} from '../types/state'

let prepareFormState!: PrepareFormState

type RemoveFirstChar<S extends string> = S extends `${infer _}${infer R}` ? R : S

beforeEach(() => {
  prepareFormState = createPrepareFormState({
    decorators: {
      prepareArrayOfObjectsInputState: jest.fn,
      prepareArrayOfObjectsMember: jest.fn,
      prepareArrayOfPrimitivesInputState: jest.fn,
      prepareArrayOfPrimitivesMember: jest.fn,
      prepareFieldMember: jest.fn,
      prepareObjectInputState: jest.fn,
      preparePrimitiveInputState: jest.fn,
    },
  })
})
const schema = createSchema({
  name: 'default',
  types: [
    defineType({
      name: 'testDocument',
      type: 'document',
      groups: [
        {name: 'groupA', title: 'Group A'},
        {name: 'groupB', title: 'Group B'},
      ],
      fields: [
        defineField({
          name: 'title',
          type: 'string',
          validation: (Rule) => Rule.required(),
          group: 'groupA',
        }),
        defineField({
          name: 'simpleObject',
          type: 'object',
          group: 'groupA',
          fields: [
            {name: 'field1', type: 'string'},
            {name: 'field2', type: 'number'},
          ],
        }),
        defineField({
          name: 'arrayOfPrimitives',
          type: 'array',
          of: [{type: 'string'}],
          group: 'groupB',
        }),
        defineField({
          name: 'arrayOfObjects',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'arrayObject',
              fields: [
                defineField({name: 'objectTitle', type: 'string'}),
                defineField({name: 'objectValue', type: 'number'}),
              ],
            },
          ],
          group: 'groupB',
        }),
        defineField({
          name: 'nestedObject',
          type: 'object',
          group: 'groupA',
          fields: [
            defineField({name: 'nestedField1', type: 'string'}),
            defineField({
              name: 'nestedObject',
              type: 'object',
              fields: [
                defineField({
                  name: 'deeplyNestedField',
                  type: 'string',
                }),
              ],
            }),
            defineField({name: 'nestedArray', type: 'array', of: [{type: 'string'}]}),
          ],
        }),
        defineField({
          name: 'conditionalField',
          type: 'string',
          hidden: ({document}) => !document?.title,
        }),
        defineField({
          name: 'fieldsetField1',
          type: 'string',
          fieldset: 'testFieldset',
          group: 'groupB',
        }),
        defineField({
          name: 'fieldsetField2',
          type: 'number',
          fieldset: 'testFieldset',
          group: 'groupB',
        }),
      ],
      fieldsets: [
        {
          name: 'testFieldset',
          options: {collapsible: true, collapsed: false},
        },
      ],
    }),
  ],
})

const schemaType = schema.get('testDocument') as ObjectSchemaType

const currentUser: Omit<CurrentUser, 'role'> = {
  email: 'rico@sanity.io',
  id: 'exampleId',
  name: 'Rico Kahler',
  roles: [],
}

const documentValue = {
  _type: 'testDocument',
  title: 'Example Test Document',
  simpleObject: {
    field1: 'Simple Object String',
    field2: 42,
  },
  arrayOfPrimitives: ['First string', 'Second string', 'Third string'],
  arrayOfObjects: [
    {
      _type: 'arrayObject',
      _key: 'object0',
      objectTitle: 'First Object',
      objectValue: 10,
    },
    {
      _type: 'arrayObject',
      _key: 'object1',
      objectTitle: 'Second Object',
      objectValue: 20,
    },
  ],
  nestedObject: {
    nestedField1: 'Nested Field Value',
    nestedObject: {
      deeplyNestedField: 'Deeply Nested Value',
    },
    nestedArray: ['Nested Array Item 1', 'Nested Array Item 2'],
  },
  conditionalField: 'This field is visible',
  fieldsetField1: 'Fieldset String Value',
  fieldsetField2: 99,
}

function setAtPath(path: Path): StateTree<boolean> {
  const [first, ...rest] = path
  if (typeof first === 'undefined') {
    return {value: true}
  }

  if (isIndexTuple(first)) return {}

  const key = typeof first === 'object' && '_key' in first ? first._key : first

  return {
    children: {
      [key]: setAtPath(rest),
    },
  }
}

function updateDocumentAtPath(path: Path, value: any): unknown {
  const [first, ...rest] = path
  if (isIndexTuple(first)) throw new Error('Unexpected index tuple')

  if (typeof first === 'undefined') return 'CHANGED'
  if (typeof first === 'string') {
    return {...value, [first]: updateDocumentAtPath(rest, value?.[first])}
  }

  if (Array.isArray(value)) {
    const index = isKeySegment(first) ? value.findIndex((item) => item?._key === first._key) : first

    return [
      ...value.slice(0, index),
      updateDocumentAtPath(rest, value[index]),
      ...value.slice(index + 1),
    ]
  }

  return updateDocumentAtPath(rest, [])
}

type FormNode =
  | ObjectFormNode
  | ArrayOfObjectsFormNode
  | ArrayOfPrimitivesFormNode
  | PrimitiveFormNode

type FormTraversalResult = [
  FormNode,
  {
    member?: FieldMember | ArrayOfObjectsItemMember | ArrayOfPrimitivesItemMember
    fieldset?: FieldsetState
  },
]

function* traverseForm(
  formNode: FormNode | null,
  parent?: FormTraversalResult[1],
): Generator<FormTraversalResult> {
  if (!formNode) return

  yield [formNode, parent ?? {}]

  if (!('members' in formNode)) return

  for (const member of formNode.members) {
    switch (member.kind) {
      case 'field': {
        yield* traverseForm(member.field as FormNode, {member})
        continue
      }
      case 'fieldSet': {
        for (const fieldsetMember of member.fieldSet.members) {
          if (fieldsetMember.kind === 'error') continue
          yield* traverseForm(fieldsetMember.field as FormNode, {
            member: fieldsetMember,
            fieldset: member.fieldSet,
          })
        }
        continue
      }
      case 'item': {
        yield* traverseForm(member.item as FormNode, {member})
        continue
      }
      default: {
        continue
      }
    }
  }
}

const rootFormNodeOptions: Partial<{
  [K in keyof RootFormStateOptions]: {
    deriveInput: (path: Path) => RootFormStateOptions[K]
    assertOutput: (node: FormTraversalResult) => void
  }
}> = {
  focusPath: {
    deriveInput: (path) => path,
    assertOutput: ([node]) => expect(node.focused).toBe(true),
  },
  openPath: {
    deriveInput: (path) => path,
    assertOutput: ([_node, {member}]) => expect(member?.open).toBe(true),
  },
  validation: {
    deriveInput: (path) => [{path, level: 'error', message: 'example marker'}],
    assertOutput: ([node]) =>
      expect(node.validation).toEqual([
        {path: node.path, level: 'error', message: 'example marker'},
      ]),
  },
  presence: {
    deriveInput: (path) => [
      {
        path,
        lastActiveAt: '2024-09-12T21:59:08.362Z',
        sessionId: 'exampleSession',
        user: {id: 'exampleUser'},
      },
    ],
    assertOutput: ([node]) =>
      expect(node.presence).toEqual([
        {
          path: node.path,
          lastActiveAt: '2024-09-12T21:59:08.362Z',
          sessionId: 'exampleSession',
          user: {id: 'exampleUser'},
        },
      ]),
  },
  documentValue: {
    deriveInput: (path) => updateDocumentAtPath(path, documentValue),
    assertOutput: ([node]) => expect(node.value).toBe('CHANGED'),
  },
  comparisonValue: {
    deriveInput: (path) => updateDocumentAtPath(path, documentValue),
    assertOutput: ([node]) => expect(node.changed).toBe(true),
  },
  readOnly: {
    deriveInput: (path) => setAtPath(path),
    assertOutput: ([node]) => expect(node.readOnly).toBe(true),
  },
}

const paths: {
  path: Path
  expectedCalls: {[K in RemoveFirstChar<keyof PrepareFormState>]: number}
}[] = [
  {
    path: ['title'],
    expectedCalls: {
      prepareArrayOfObjectsInputState: 0,
      prepareArrayOfObjectsMember: 0,
      prepareArrayOfPrimitivesInputState: 0,
      prepareArrayOfPrimitivesMember: 0,
      prepareFieldMember: 8,
      prepareObjectInputState: 1,
      preparePrimitiveInputState: 1,
    },
  },
  {
    path: ['simpleObject', 'field1'],
    expectedCalls: {
      prepareArrayOfObjectsInputState: 0,
      prepareArrayOfObjectsMember: 0,
      prepareArrayOfPrimitivesInputState: 0,
      prepareArrayOfPrimitivesMember: 0,
      prepareFieldMember: 10,
      prepareObjectInputState: 2,
      preparePrimitiveInputState: 1,
    },
  },
  {
    path: ['arrayOfPrimitives', 1],
    expectedCalls: {
      prepareArrayOfObjectsInputState: 0,
      prepareArrayOfObjectsMember: 0,
      prepareArrayOfPrimitivesInputState: 1,
      prepareArrayOfPrimitivesMember: 3,
      prepareFieldMember: 8,
      prepareObjectInputState: 1,
      preparePrimitiveInputState: 1,
    },
  },
  {
    path: ['arrayOfObjects', {_key: 'object1'}, 'objectTitle'],
    expectedCalls: {
      prepareArrayOfObjectsInputState: 1,
      prepareArrayOfObjectsMember: 2,
      prepareArrayOfPrimitivesInputState: 0,
      prepareArrayOfPrimitivesMember: 0,
      prepareFieldMember: 10,
      prepareObjectInputState: 2,
      preparePrimitiveInputState: 1,
    },
  },
  {
    path: ['nestedObject', 'nestedField1'],
    expectedCalls: {
      prepareArrayOfObjectsInputState: 0,
      prepareArrayOfObjectsMember: 0,
      prepareArrayOfPrimitivesInputState: 0,
      prepareArrayOfPrimitivesMember: 0,
      prepareFieldMember: 11,
      prepareObjectInputState: 2,
      preparePrimitiveInputState: 1,
    },
  },
  {
    path: ['nestedObject', 'nestedObject', 'deeplyNestedField'],
    expectedCalls: {
      prepareArrayOfObjectsInputState: 0,
      prepareArrayOfObjectsMember: 0,
      prepareArrayOfPrimitivesInputState: 0,
      prepareArrayOfPrimitivesMember: 0,
      prepareFieldMember: 12,
      prepareObjectInputState: 3,
      preparePrimitiveInputState: 1,
    },
  },
  {
    path: ['nestedObject', 'nestedArray', 0],
    expectedCalls: {
      prepareArrayOfObjectsInputState: 0,
      prepareArrayOfObjectsMember: 0,
      prepareArrayOfPrimitivesInputState: 1,
      prepareArrayOfPrimitivesMember: 2,
      prepareFieldMember: 11,
      prepareObjectInputState: 2,
      preparePrimitiveInputState: 1,
    },
  },
]

const defaultOptions: RootFormStateOptions = {
  currentUser,
  focusPath: [],
  openPath: [],
  presence: [],
  schemaType,
  validation: [],
  changesOpen: false,
  collapsedFieldSets: {},
  collapsedPaths: {},
  documentValue,
  comparisonValue: documentValue,
  fieldGroupState: {},
  hidden: undefined,
  readOnly: undefined,
}

describe.each(
  Object.entries(rootFormNodeOptions).map(([property, {deriveInput, assertOutput}]) => ({
    property,
    deriveInput,
    assertOutput,
  })),
)('$property', ({property, deriveInput, assertOutput}) => {
  test.each(paths)('$path', ({path, expectedCalls}) => {
    const initialFormState = prepareFormState(defaultOptions)
    const initialNodes = new Set(Array.from(traverseForm(initialFormState)).map(([node]) => node))

    // reset toHaveBeenCalledTimes amount
    jest.clearAllMocks()

    const updatedFormState = prepareFormState({
      ...defaultOptions,
      ...{[property]: deriveInput(path)},
    })
    const updatedNodes = Array.from(traverseForm(updatedFormState)).reverse()

    const differentNodes = updatedNodes.filter(([node]) => !initialNodes.has(node))
    expect(differentNodes).not.toHaveLength(0)

    assertOutput(differentNodes[0])

    for (const [differentNode] of differentNodes) {
      expect(startsWith(differentNode.path, path)).toBe(true)
    }

    expect(prepareFormState._prepareArrayOfObjectsInputState).toHaveBeenCalledTimes(
      expectedCalls.prepareArrayOfObjectsInputState,
    )
    expect(prepareFormState._prepareArrayOfObjectsMember).toHaveBeenCalledTimes(
      expectedCalls.prepareArrayOfObjectsMember,
    )
    expect(prepareFormState._prepareArrayOfPrimitivesInputState).toHaveBeenCalledTimes(
      expectedCalls.prepareArrayOfPrimitivesInputState,
    )
    expect(prepareFormState._prepareArrayOfPrimitivesMember).toHaveBeenCalledTimes(
      expectedCalls.prepareArrayOfPrimitivesMember,
    )
    expect(prepareFormState._prepareFieldMember).toHaveBeenCalledTimes(
      expectedCalls.prepareFieldMember,
    )
    expect(prepareFormState._prepareObjectInputState).toHaveBeenCalledTimes(
      expectedCalls.prepareObjectInputState,
    )
    expect(prepareFormState._preparePrimitiveInputState).toHaveBeenCalledTimes(
      expectedCalls.preparePrimitiveInputState,
    )
  })
})

describe('hidden', () => {
  const pathsToTest: {
    path: Path
    expectedCalls: {[K in RemoveFirstChar<keyof PrepareFormState>]: number}
  }[] = [
    {
      path: ['title'],
      expectedCalls: {
        prepareArrayOfObjectsInputState: 0,
        prepareArrayOfObjectsMember: 0,
        prepareArrayOfPrimitivesInputState: 0,
        prepareArrayOfPrimitivesMember: 0,
        prepareFieldMember: 8,
        prepareObjectInputState: 1,
        preparePrimitiveInputState: 0,
      },
    },
    {
      path: ['simpleObject', 'field1'],
      expectedCalls: {
        prepareArrayOfObjectsInputState: 0,
        prepareArrayOfObjectsMember: 0,
        prepareArrayOfPrimitivesInputState: 0,
        prepareArrayOfPrimitivesMember: 0,
        prepareFieldMember: 10,
        prepareObjectInputState: 2,
        preparePrimitiveInputState: 0,
      },
    },
    {
      path: ['arrayOfPrimitives'],
      expectedCalls: {
        prepareArrayOfObjectsInputState: 0,
        prepareArrayOfObjectsMember: 0,
        prepareArrayOfPrimitivesInputState: 1,
        prepareArrayOfPrimitivesMember: 0,
        prepareFieldMember: 8,
        prepareObjectInputState: 1,
        preparePrimitiveInputState: 0,
      },
    },
    {
      path: ['arrayOfObjects', {_key: 'object1'}, 'objectTitle'],
      expectedCalls: {
        prepareArrayOfObjectsInputState: 1,
        prepareArrayOfObjectsMember: 2,
        prepareArrayOfPrimitivesInputState: 0,
        prepareArrayOfPrimitivesMember: 0,
        prepareFieldMember: 10,
        prepareObjectInputState: 2,
        preparePrimitiveInputState: 0,
      },
    },
  ]

  test.each(pathsToTest)('$path', ({path, expectedCalls}) => {
    const hidden = setAtPath(path)

    const initialFormState = prepareFormState(defaultOptions)
    const initialNodes = new Set(Array.from(traverseForm(initialFormState)).map(([node]) => node))

    // reset toHaveBeenCalledTimes amount
    jest.clearAllMocks()

    const updatedFormState = prepareFormState({
      ...defaultOptions,
      hidden,
    })
    const updatedNodes = Array.from(traverseForm(updatedFormState)).reverse()
    const differentNodes = updatedNodes.filter(([node]) => !initialNodes.has(node))

    expect(differentNodes).not.toHaveLength(0)
    for (const [differentNode] of differentNodes) {
      expect(startsWith(differentNode.path, path)).toBe(true)
    }

    // Verify memoization: functions should be called only for affected nodes
    expect(prepareFormState._prepareArrayOfObjectsInputState).toHaveBeenCalledTimes(
      expectedCalls.prepareArrayOfObjectsInputState,
    )
    expect(prepareFormState._prepareArrayOfObjectsMember).toHaveBeenCalledTimes(
      expectedCalls.prepareArrayOfObjectsMember,
    )
    expect(prepareFormState._prepareArrayOfPrimitivesInputState).toHaveBeenCalledTimes(
      expectedCalls.prepareArrayOfPrimitivesInputState,
    )
    expect(prepareFormState._prepareArrayOfPrimitivesMember).toHaveBeenCalledTimes(
      expectedCalls.prepareArrayOfPrimitivesMember,
    )
    expect(prepareFormState._prepareFieldMember).toHaveBeenCalledTimes(
      expectedCalls.prepareFieldMember,
    )
    expect(prepareFormState._prepareObjectInputState).toHaveBeenCalledTimes(
      expectedCalls.prepareObjectInputState,
    )
    expect(prepareFormState._preparePrimitiveInputState).toHaveBeenCalledTimes(
      expectedCalls.preparePrimitiveInputState,
    )
  })
})

describe('collapsedPaths', () => {
  const pathsToTest: {
    path: Path
    expectedCalls: {[K in RemoveFirstChar<keyof PrepareFormState>]: number}
  }[] = [
    {
      path: ['simpleObject'],
      expectedCalls: {
        prepareArrayOfObjectsInputState: 0,
        prepareArrayOfObjectsMember: 0,
        prepareArrayOfPrimitivesInputState: 0,
        prepareArrayOfPrimitivesMember: 0,
        prepareFieldMember: 10,
        prepareObjectInputState: 2,
        preparePrimitiveInputState: 0,
      },
    },
    {
      path: ['arrayOfObjects', {_key: 'object1'}],
      expectedCalls: {
        prepareArrayOfObjectsInputState: 1,
        prepareArrayOfObjectsMember: 2,
        prepareArrayOfPrimitivesInputState: 0,
        prepareArrayOfPrimitivesMember: 0,
        prepareFieldMember: 10,
        prepareObjectInputState: 2,
        preparePrimitiveInputState: 0,
      },
    },
    {
      path: ['nestedObject', 'nestedObject'],
      expectedCalls: {
        prepareArrayOfObjectsInputState: 0,
        prepareArrayOfObjectsMember: 0,
        prepareArrayOfPrimitivesInputState: 0,
        prepareArrayOfPrimitivesMember: 0,
        prepareFieldMember: 12,
        prepareObjectInputState: 3,
        preparePrimitiveInputState: 0,
      },
    },
  ]

  test.each(pathsToTest)('$path', ({path, expectedCalls}) => {
    const collapsedPaths = setAtPath(path)

    // Prepare initial form state
    prepareFormState(defaultOptions)

    // reset toHaveBeenCalledTimes amount
    jest.clearAllMocks()

    // Prepare updated form state with collapsedPaths set
    const updatedFormState = prepareFormState({
      ...defaultOptions,
      collapsedPaths,
    })

    // Traverse updated form state
    const updatedNodes = Array.from(traverseForm(updatedFormState))

    // Find the member at the path
    const memberAtPath = updatedNodes.find(
      ([node, {member}]) => toString(node.path) === toString(path) && member !== undefined,
    )

    expect(memberAtPath).toBeDefined()
    const member = memberAtPath![1].member
    expect(member && 'collapsed' in member && member.collapsed).toBe(true)

    // Verify memoization: functions should be called only for affected nodes
    expect(prepareFormState._prepareArrayOfObjectsInputState).toHaveBeenCalledTimes(
      expectedCalls.prepareArrayOfObjectsInputState,
    )
    expect(prepareFormState._prepareArrayOfObjectsMember).toHaveBeenCalledTimes(
      expectedCalls.prepareArrayOfObjectsMember,
    )
    expect(prepareFormState._prepareArrayOfPrimitivesInputState).toHaveBeenCalledTimes(
      expectedCalls.prepareArrayOfPrimitivesInputState,
    )
    expect(prepareFormState._prepareArrayOfPrimitivesMember).toHaveBeenCalledTimes(
      expectedCalls.prepareArrayOfPrimitivesMember,
    )
    expect(prepareFormState._prepareFieldMember).toHaveBeenCalledTimes(
      expectedCalls.prepareFieldMember,
    )
    expect(prepareFormState._prepareObjectInputState).toHaveBeenCalledTimes(
      expectedCalls.prepareObjectInputState,
    )
    expect(prepareFormState._preparePrimitiveInputState).toHaveBeenCalledTimes(
      expectedCalls.preparePrimitiveInputState,
    )
  })
})

describe('collapsedFieldSets', () => {
  test('collapsedFieldSets', () => {
    const fieldsetName = 'testFieldset'
    const path = [fieldsetName] // Use the fieldset name directly
    const collapsedFieldSets = setAtPath(path)

    // Prepare initial form state
    prepareFormState(defaultOptions)

    jest.clearAllMocks()

    // Prepare updated form state with collapsedFieldSets set
    const updatedFormState = prepareFormState({
      ...defaultOptions,
      collapsedFieldSets,
    })

    // Traverse updated form state
    const updatedNodes = Array.from(traverseForm(updatedFormState))

    // Find the fieldset member
    const fieldsetNode = updatedNodes.find(
      ([_node, {fieldset}]) => fieldset?.name === fieldsetName,
    )!

    const [, {fieldset}] = fieldsetNode

    expect(fieldset?.collapsed).toBe(true)

    // Verify memoization: functions should be called only for affected nodes
    expect(prepareFormState._prepareArrayOfObjectsInputState).toHaveBeenCalledTimes(0)
    expect(prepareFormState._prepareArrayOfObjectsMember).toHaveBeenCalledTimes(0)
    expect(prepareFormState._prepareArrayOfPrimitivesInputState).toHaveBeenCalledTimes(0)
    expect(prepareFormState._prepareArrayOfPrimitivesMember).toHaveBeenCalledTimes(0)
    expect(prepareFormState._prepareFieldMember).toHaveBeenCalledTimes(8)
    expect(prepareFormState._prepareObjectInputState).toHaveBeenCalledTimes(1)
    expect(prepareFormState._preparePrimitiveInputState).toHaveBeenCalledTimes(0)
  })
})

describe('fieldGroupState', () => {
  test('fieldGroupState', () => {
    const initialFormState = prepareFormState(defaultOptions)
    const initialNodes = new Set(Array.from(traverseForm(initialFormState)).map(([node]) => node))

    // Reset call counts
    jest.clearAllMocks()

    const updatedFormState = prepareFormState({
      ...defaultOptions,
      fieldGroupState: {value: 'groupA'},
    })

    const updatedNodes = Array.from(traverseForm(updatedFormState)).reverse()
    expect(updatedNodes.length).toBeGreaterThan(1)
    const differentNodes = updatedNodes.filter(([node]) => !initialNodes.has(node))
    expect(differentNodes.length).toBeGreaterThan(0)
    expect(differentNodes.length).toBeLessThan(updatedNodes.length)

    expect(updatedFormState?.members.map((i) => i.key)).toEqual([
      'field-title',
      'field-simpleObject',
      'field-nestedObject',
    ])

    // Verify memoization: functions should be called only for affected nodes
    expect(prepareFormState._prepareArrayOfObjectsInputState).toHaveBeenCalledTimes(1)
    expect(prepareFormState._prepareArrayOfObjectsMember).toHaveBeenCalledTimes(0)
    expect(prepareFormState._prepareArrayOfPrimitivesInputState).toHaveBeenCalledTimes(1)
    expect(prepareFormState._prepareArrayOfPrimitivesMember).toHaveBeenCalledTimes(0)
    expect(prepareFormState._prepareFieldMember).toHaveBeenCalledTimes(8)
    expect(prepareFormState._prepareObjectInputState).toHaveBeenCalledTimes(3)
    expect(prepareFormState._preparePrimitiveInputState).toHaveBeenCalledTimes(4)
  })
})

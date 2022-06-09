import {resolveInitialValue} from '../'
import {resolveValue} from '../resolve'
import {defaultTemplatesForSchema} from '../prepare'
import {schema} from './schema'

function generateNestedObjectTest(
  obj: Record<string, any>,
  maxDepth: number,
  depth?: number
): Record<string, any> {
  depth = depth || 1
  if (depth >= maxDepth) return obj

  depth++
  return {
    ...obj,
    child: generateNestedObjectTest(obj, maxDepth, depth),
  }
}

describe('resolveDeepInitialValues', () => {
  test('resolves deep, recursive default values', async () => {
    const defaultTemplates = defaultTemplatesForSchema(schema)
    const developerTemplate = defaultTemplates.find((tpl) => tpl.id === 'developer')
    if (!developerTemplate) {
      throw new Error('Could not find developer template')
    }

    const initialValue = await resolveInitialValue(schema, developerTemplate)

    expect(initialValue.tasks[0]).toHaveProperty('_key')

    initialValue.tasks[0]._key = '1b2e4ce9629e0e7f1caa4f4778d81a49'

    expect(initialValue).toEqual({
      _type: 'developer',
      name: 'A default name!',
      hasPet: false,
      age: 30,
      heroImage: {
        _type: 'captionedImage',
        caption: 'Default caption!',
      },
      awards: ['TypeScript Wizard of the Year'],
      tasks: [
        {
          _key: '1b2e4ce9629e0e7f1caa4f4778d81a49',
          _type: 'task',
          description: 'Mark as done',
          isDone: false,
        },
      ],
      numberOfCats: undefined,
      recursive: generateNestedObjectTest(
        {
          _type: 'recursiveObject',
          name: '∞ recursion is ∞',
        },
        9
      ),
    })
  })

  test('resolves deep primitive type with initial value in field', async () => {
    const defaultTemplates = defaultTemplatesForSchema(schema)
    const personTemplate = defaultTemplates.find((tpl) => tpl.id === 'person')
    if (!personTemplate) {
      throw new Error('Could not find person template')
    }

    const initialValue = await resolveInitialValue(schema, personTemplate)
    expect(initialValue).toEqual({
      _type: 'person',
      address: {
        _type: 'address',
        street: 'one old street',
        streetNo: '123',
      },
    })
  })

  test('resolves deep primitive type and overrides child initial value in field by parents', async () => {
    const defaultTemplates = defaultTemplatesForSchema(schema)
    const personTemplate = defaultTemplates.find((tpl) => tpl.id === 'person')
    if (!personTemplate) {
      throw new Error('Could not find person template')
    }

    const initialValue = await resolveInitialValue(schema, {
      ...personTemplate,
      value: {
        ...resolveValue(personTemplate.value),
        address: {
          _type: 'address',
          street: 'one new street',
        },
      },
    })

    expect(initialValue).toEqual({
      _type: 'person',
      address: {
        _type: 'address',
        street: 'one new street',
        streetNo: '123',
      },
    })
  })

  test('resolves deep primitive type and skip child values when parent is undefined', async () => {
    const defaultTemplates = defaultTemplatesForSchema(schema)
    const personTemplate = defaultTemplates.find((tpl) => tpl.id === 'person')
    if (!personTemplate) {
      throw new Error('Could not find person template')
    }

    const initialValue = await resolveInitialValue(schema, {
      ...personTemplate,
      value: {
        ...resolveValue(personTemplate.value),
        address: undefined,
      },
    })

    expect(initialValue).toStrictEqual({
      _type: 'person',
      address: undefined,
    })
  })

  test('resolves deep primitive type and remove initial values with just _type specified', async () => {
    const defaultTemplates = defaultTemplatesForSchema(schema)
    const personTemplate = defaultTemplates.find((tpl) => tpl.id === 'person')
    if (!personTemplate) {
      throw new Error('Could not find person template')
    }

    const initialValue = await resolveInitialValue(schema, {
      ...personTemplate,
      value: {
        ...resolveValue(personTemplate.value),
        contact: {
          _type: 'contact',
        },
      },
    })

    expect(initialValue).toEqual({
      _type: 'person',
      address: {
        _type: 'address',
        street: 'one old street',
        streetNo: '123',
      },
      contact: {
        _type: 'contact',
      },
    })
  })
})

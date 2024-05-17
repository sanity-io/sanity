import {
  type SchemaType,
  type SchemaTypeDefinition,
  type SchemaValidationProblemGroup,
} from '@sanity/types'
import {flatten, get} from 'lodash'

import {type ProblemPath, type ProblemPathPropertySegment, type TypeWithProblems} from './typedefs'
import {error} from './validation/createValidationResult'

/**
 * @internal
 */
export function groupProblems(types: SchemaTypeDefinition[]): SchemaValidationProblemGroup[] {
  return flatten<TypeWithProblems>(types.map((type) => getTypeProblems(type))).filter(
    (type) => type.problems.length > 0,
  )
}

function createTypeWithMembersProblemsAccessor(
  memberPropertyName: string,
  getMembers = (type: SchemaType) => get(type, memberPropertyName),
) {
  return function getProblems(type: any, parentPath: ProblemPath): TypeWithProblems[] {
    const currentPath: ProblemPath = [
      ...parentPath,
      {kind: 'type', type: type.type, name: type.name},
    ]

    const members = getMembers(type) || []

    const memberProblems: TypeWithProblems[][] = Array.isArray(members)
      ? members.map((memberType) => {
          const propertySegment: ProblemPathPropertySegment = {
            kind: 'property',
            name: memberPropertyName,
          }
          const memberPath: ProblemPath = [...currentPath, propertySegment]
          return getTypeProblems(memberType, memberPath as any)
        })
      : [
          [
            {
              path: currentPath,
              problems: [error(`Member declaration (${memberPropertyName}) is not an array`)],
            },
          ],
        ]

    return [
      {
        path: currentPath,
        problems: type._problems || [],
      },
      ...flatten(memberProblems),
    ]
  }
}

const arrify = (val: any) =>
  Array.isArray(val) ? val : (typeof val === 'undefined' && []) || [val]

const getObjectProblems = createTypeWithMembersProblemsAccessor('fields')
const getImageProblems = createTypeWithMembersProblemsAccessor('fields')
const getFileProblems = createTypeWithMembersProblemsAccessor('fields')
const getArrayProblems = createTypeWithMembersProblemsAccessor('of')
const getReferenceProblems = createTypeWithMembersProblemsAccessor('to', (type) =>
  'to' in type ? arrify(type.to) : [],
)
const getBlockAnnotationProblems = createTypeWithMembersProblemsAccessor('marks.annotations')
const getBlockMemberProblems = createTypeWithMembersProblemsAccessor('of')
const getBlockProblems = (type: any, problems: any) => [
  ...getBlockAnnotationProblems(type, problems),
  ...getBlockMemberProblems(type, problems),
]

function getDefaultProblems(type: any, path = []): TypeWithProblems[] {
  return [
    {
      path: [...path, {kind: 'type', type: type.type, name: type.name}],
      problems: type._problems || [],
    },
  ]
}

function getTypeProblems(type: SchemaTypeDefinition, path = []): TypeWithProblems[] {
  switch (type.type) {
    case 'object': {
      return getObjectProblems(type, path)
    }
    case 'document': {
      return getObjectProblems(type, path)
    }
    case 'array': {
      return getArrayProblems(type, path)
    }
    case 'reference': {
      return getReferenceProblems(type, path)
    }
    case 'block': {
      return getBlockProblems(type, path)
    }
    case 'image': {
      return getImageProblems(type, path)
    }
    case 'file': {
      return getFileProblems(type, path)
    }
    default: {
      return getDefaultProblems(type, path)
    }
  }
}

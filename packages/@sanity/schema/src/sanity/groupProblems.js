import {flatten} from 'lodash'

function createTypeWithMembersProblemsAccessor(memberPropertyName, getMembers = type => type[memberPropertyName]) {
  return function getProblems(type, parentPath) {
    const currentPath = [
      ...parentPath,
      {kind: 'type', type: type.type, name: type.name}
    ]
    const members = getMembers(type) || []

    const memberProblems = members.map(memberType => {
      const memberPath = [...currentPath, {kind: 'property', name: memberPropertyName}]
      return getTypeProblems(memberType, memberPath)
    })

    return [
      {
        path: currentPath,
        problems: type._problems || []
      },
      ...flatten(memberProblems)
    ]
  }
}

const arrify = val => (Array.isArray(val)
  ? val
  : ((typeof val === 'undefined' && []) || [val])
)

const getObjectProblems = createTypeWithMembersProblemsAccessor('fields')
const getArrayProblems = createTypeWithMembersProblemsAccessor('of')
const getReferenceProblems = createTypeWithMembersProblemsAccessor('to', type => arrify(type.to))

function getDefaultProblems(type, path = []) {
  return [
    {
      path: [...path, {kind: 'type', type: type.type, name: type.name}],
      problems: type._problems || []
    }
  ]
}

export function getTypeProblems(type, path = []) {
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
    default: {
      return getDefaultProblems(type, path)
    }
  }
}

export default function groupProblems(types) {
  return flatten(types
    .map(getTypeProblems))
    .filter(type => type.problems.length > 0)
}

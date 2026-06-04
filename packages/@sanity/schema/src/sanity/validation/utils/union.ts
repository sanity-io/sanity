import humanizeList from 'humanize-list'

import {coreTypeNames} from '../../coreTypes'

export function isIntrinsicUnionDefinition(typeDef: any): boolean {
  return typeDef?.type === 'union' && Array.isArray(typeDef.of)
}

export function isUnionDeclaration(typeDef: any, visitorContext: any): boolean {
  if (typeDef?.type !== 'union') {
    return false
  }

  if (Object.prototype.hasOwnProperty.call(typeDef, 'of')) {
    return true
  }

  return !getTypeDefinition('union', visitorContext)
}

export function getStoredMemberName(member: any): string | undefined {
  return member?.name || member?.type
}

function getTypeDefinition(typeName: string | undefined, visitorContext: any) {
  if (!typeName) {
    return null
  }

  return visitorContext.getTypeDefinition?.(typeName) || visitorContext.getType(typeName)
}

export function resolveJsonType(
  typeDef: any,
  visitorContext: any,
  seen: Set<string> = new Set(),
): string | undefined {
  if (!typeDef || typeof typeDef !== 'object') {
    return undefined
  }

  if (isIntrinsicUnionDefinition(typeDef)) {
    return 'object'
  }

  if ('jsonType' in typeDef) {
    return typeDef.jsonType
  }

  if (!typeDef.type || seen.has(typeDef.type)) {
    return undefined
  }

  seen.add(typeDef.type)

  const parentType = getTypeDefinition(typeDef.type, visitorContext)
  return parentType ? resolveJsonType(parentType, visitorContext, seen) : undefined
}

export function isUnionTypeReference(member: any, visitorContext: any): boolean {
  if (isIntrinsicUnionDefinition(member)) {
    return true
  }

  const referencedType = getTypeDefinition(member?.type, visitorContext)
  return isIntrinsicUnionDefinition(referencedType)
}

export function isNamedUnionTypeReference(member: any, visitorContext: any): boolean {
  if (isIntrinsicUnionDefinition(member)) {
    return false
  }

  const referencedType = getTypeDefinition(member?.type, visitorContext)
  return isIntrinsicUnionDefinition(referencedType)
}

export function isObjectBackedMember(member: any, visitorContext: any): boolean {
  return resolveJsonType(member, visitorContext) === 'object'
}

export function formatMemberList(members: any[]): string {
  return humanizeList(members.map((member) => `"${getStoredMemberName(member)}"`))
}

export function hasBuiltinNameConflict(member: any): boolean {
  return (
    typeof member?.name === 'string' &&
    member.name !== member.type &&
    coreTypeNames.includes(member.name)
  )
}

function resolveConcreteTypeLineage(
  typeDef: any,
  visitorContext: any,
  seen: Set<string> = new Set(),
): string | undefined {
  if (!typeDef || typeof typeDef !== 'object' || !typeDef.type || seen.has(typeDef.type)) {
    return undefined
  }

  seen.add(typeDef.type)

  const parentType = getTypeDefinition(typeDef.type, visitorContext)
  if (!parentType) {
    return typeDef.type
  }

  return [typeDef.type, resolveConcreteTypeLineage(parentType, visitorContext, seen)]
    .filter(Boolean)
    .join('>')
}

export function isCompatibleMemberOverride(left: any, right: any, visitorContext: any): boolean {
  return (
    getStoredMemberName(left) === getStoredMemberName(right) &&
    resolveConcreteTypeLineage(left, visitorContext) ===
      resolveConcreteTypeLineage(right, visitorContext)
  )
}

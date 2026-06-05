import {isUnionSchemaType, type SchemaType, type UnionSchemaType} from '@sanity/types'

export type EffectiveArrayMember = {
  member: SchemaType
  source: 'direct' | 'union'
  sourceUnion?: UnionSchemaType
}

export function isIntrinsicUnionDefinition(typeDef: any): boolean {
  return typeDef?.type === 'union' && Array.isArray(typeDef.of)
}

export function isCompiledUnionType(type: unknown): type is UnionSchemaType {
  return isUnionSchemaType(type)
}

function getStoredMemberName(member: any): string {
  return member.name || member.type?.name || member.type
}

function isCompatibleMember(left: SchemaType, right: SchemaType): boolean {
  return Boolean(left.type?.name && left.type.name === right.type?.name)
}

export function flattenArrayMemberTypesWithSources(members: SchemaType[]): EffectiveArrayMember[] {
  const effective: Array<EffectiveArrayMember & {key: string}> = []

  function add(entry: EffectiveArrayMember) {
    const key = getStoredMemberName(entry.member)
    const duplicateIndex = effective.findIndex(
      (existing) =>
        existing.key === key &&
        (existing.source === 'union' || entry.source === 'union') &&
        isCompatibleMember(existing.member, entry.member),
    )

    if (duplicateIndex === -1) {
      effective.push({...entry, key})
      return
    }

    if (entry.source === 'direct') {
      effective[duplicateIndex] = {...entry, key}
    }
  }

  for (const member of members) {
    if (isCompiledUnionType(member)) {
      for (const unionMember of member.of) {
        add({member: unionMember, source: 'union', sourceUnion: member})
      }
      continue
    }

    add({member, source: 'direct'})
  }

  return effective
}

export function flattenUnionMembers(members: SchemaType[]): SchemaType[] {
  return flattenArrayMemberTypesWithSources(members).map((entry) => entry.member)
}

import {StructureBuilder} from 'sanity/lib/dts/src/_exports/desk'
import {Schema} from '@sanity/types'

type StructureGroup = 'v3' // extend with union strings

export interface StructureGroupOption {
  structureGroup?: StructureGroup
}

type MaybeStructureOptions = StructureGroupOption | undefined

export function typesInOptionGroup(
  S: StructureBuilder,
  schema: Schema,
  groupName: StructureGroup
): string[] {
  return S.documentTypeListItems()
    .map((item) => item.getId())
    .filter((id): id is string => {
      return (
        !!id && (schema.get(id)?.options as MaybeStructureOptions)?.structureGroup === groupName
      )
    })
}

export function structureGroupOptions<
  O extends Required<StructureGroupOption> & Schema.ObjectOptions
>(options: O): O & Schema.ObjectOptions {
  return options
}

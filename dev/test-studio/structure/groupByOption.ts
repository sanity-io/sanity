import type {StructureBuilder} from 'sanity/desk'
import {ObjectOptions, Schema} from '@sanity/types'

type StructureGroup = 'v3' | '3d' // extend with union strings

export interface StructureGroupOption {
  structureGroup?: StructureGroup
}

type MaybeStructureOptions = StructureGroupOption | undefined

export function typesInOptionGroup(
  S: StructureBuilder,
  schema: Schema,
  groupName: StructureGroup,
): string[] {
  return S.documentTypeListItems()
    .map((item) => item.getId())
    .filter((id): id is string => {
      return (
        !!id && (schema.get(id)?.options as MaybeStructureOptions)?.structureGroup === groupName
      )
    })
}

export function structureGroupOptions<O extends Required<StructureGroupOption> & ObjectOptions>(
  options: O,
): O & ObjectOptions {
  return options
}

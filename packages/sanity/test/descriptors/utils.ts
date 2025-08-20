import {type EncodableObject, type EncodableValue} from '@sanity/descriptors'
import {createSchemaFromManifestTypes} from '@sanity/schema/_internal'
import {type Schema} from '@sanity/types'
import {cloneDeep, startCase} from 'lodash'
import {expect} from 'vitest'

import {extractManifestSchemaTypes} from '../../src/_internal/manifest/extractWorkspaceManifest'
import {DESCRIPTOR_CONVERTER} from '../../src/core/schema'

type Descriptor = ReturnType<(typeof DESCRIPTOR_CONVERTER)['get']>

export function expectManifestSchemaConversion(schema: Schema, schemaDescriptor: Descriptor) {
  // Extract the manifest schema types
  const manifestSchemaTypes = extractManifestSchemaTypes(schema)

  // Serialize to simulate transmitting the schema over the server
  const data = JSON.parse(JSON.stringify(manifestSchemaTypes))

  // Convert the raw json back into a Schema
  const converted = createSchemaFromManifestTypes({name: schema.name, types: data})

  const convertedDescriptor = DESCRIPTOR_CONVERTER.get(converted)

  // Compare the underlying typedefs since there are known inconsistencies between the serialized schemaschema
  // and the serialized manifest schema
  const convertedObjectValues = Object.values(convertedDescriptor.objectValues)
  const schemaObjectValues = Object.values(schemaDescriptor.objectValues)
  expect(convertedObjectValues.length).toEqual(schemaObjectValues.length)
  for (const convertedObjectValue of convertedObjectValues) {
    const schemaObjectValue = schemaObjectValues.find(
      (t) => t.name === convertedObjectValue.name && t.type === convertedObjectValue.type,
    )

    expect(schemaObjectValue).toBeDefined()

    const titles = extractTitleMap(convertedObjectValue.typeDef)
    const stype = cloneDeep(schemaObjectValue?.typeDef)
    normalizeSchemaDescriptorTypeDef(stype, titles)
    expect(convertedObjectValue.typeDef).toStrictEqual(stype)
  }
}

function extractTitleMap(data: unknown) {
  const titles: Record<string, string> = {}

  function extract(obj: any, path: string) {
    if (!isObject(obj)) return

    // Add title if it differs from the name
    if (
      'title' in obj &&
      typeof obj.title === 'string' &&
      (!('name' in obj) || (typeof obj.name === 'string' && startCase(obj.name) !== obj.title))
    ) {
      titles[`${path}.title`] = obj.title
    }

    // Process all properties
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'title') return

      if (Array.isArray(value)) {
        value.forEach((item, i) => extract(item, `${path}.${key}[${i}]`))
      } else if (value && typeof value === 'object') {
        extract(value, `${path}.${key}`)
      }
    }
  }

  extract(data, '$')
  return titles
}

// normalizeSchemaDescriptorTypeDef turns a descriptor type definition into a normalized version
// which is equivalent to what the createSchemaFromManifest returns. This serves as documentation
// for how well we're able to convert the manifest type into a descriptor. Preferably this
// function should be empty (which would correspond to createSchemaFromManifest preserving all data).
//
// obj will be modified in place.
function normalizeSchemaDescriptorTypeDef(
  obj: EncodableValue | undefined,
  titles: Record<string, string>,
) {
  if (!isEncodableObject(obj)) return

  // The final form of options is determined by it's initial state. If the property starts as empty object,
  // then it should end in a empty object. If options is "effictively" empty (i.e. all properties are undefined or empty objects)
  // then options will be set to undefined.
  const optionsAreEmpty = isEmptyObject(obj.options)

  // Coerce titles which were added during extractManifestSchemaTypes. This can happen when the
  // default title for a type isn't stripped by extractManifestSchemaTypes. For example:
  //
  //    { name: 'foo', type: 'string' }
  //
  // which will be extracted as:
  //
  //    { name: 'foo', type: 'string', title: 'String' }
  //
  coerceTitles(obj, titles)

  // Remove any properties which are not serializable
  unsetUnserializableTypesDeep(obj)

  // Unset any fieldsets
  normalizeFieldsets(obj)

  // Remove all instances of groups must occur after handling fieldsets as
  // the determination to keep a fieldset depends on the presence of groups
  unsetKeyDeep(obj, 'groups')

  // Remove any instance of i18nTitleKey, we only need to do this once since we
  // need to remove all instances of the property
  deleteKeyDeep(obj, 'i18nTitleKey')

  // If options are effictively empty (i.e. it is just comprised of empty objects)
  // the field is unset. This happens unless the object started out as empty before
  // any normalization.
  if (!optionsAreEmpty) {
    normalizeOptions(obj)
  }
}

function isEncodableObject(val: EncodableValue | undefined): val is EncodableObject {
  return isRecord(val)
}

function isObject(val: unknown): val is object {
  return val !== null && typeof val === 'object'
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return isObject(val) && !Array.isArray(val)
}

function isEmptyObject(obj: unknown) {
  return isRecord(obj) && Object.keys(obj).length === 0
}

function deleteKeyDeep(obj: unknown, target: string) {
  if (!isRecord(obj)) {
    return
  }

  delete obj[target]

  for (const val of Object.values(obj)) {
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        deleteKeyDeep(val[i], target)
      }
    } else {
      deleteKeyDeep(val, target)
    }
  }
}

function unsetKeyDeep(obj: unknown, target: string) {
  if (!isRecord(obj)) {
    return
  }

  if (target in obj) {
    obj[target] = undefined
  }

  for (const val of Object.values(obj)) {
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        unsetKeyDeep(val[i], target)
      }
    } else {
      unsetKeyDeep(val, target)
    }
  }
}

// Check if options contain unserializable types
function unsetUnserializableTypesDeep(obj: unknown) {
  // Handle arrays
  if (Array.isArray(obj)) {
    obj.map((item) => unsetUnserializableTypesDeep(item))
  }

  if (!isRecord(obj)) return

  // Handle objects
  for (const key of Object.keys(obj)) {
    if (
      obj[key] &&
      typeof obj[key] === 'object' &&
      '__type' in obj[key] &&
      typeof obj[key].__type === 'string' &&
      ['function', 'cyclic', 'maxDepth', 'jsx'].includes(obj[key].__type)
    ) {
      // Known properties are unset
      if (['hidden', 'readOnly', 'description'].includes(key)) {
        obj[key] = undefined
      } else {
        // Custom props are deleted as they are undefined in extractManifestSchemaTypes and the
        // serialization process will remove them
        delete obj[key]
      }
    }

    unsetUnserializableTypesDeep(obj[key])
  }
}

function normalizeFieldsets(obj: EncodableObject) {
  // extractWorkspaceManifest excludes fieldsets which are singluar (.single == true) except for when there are groups
  if (Array.isArray(obj.fieldsets) && obj.fieldsets.length > 0) {
    if (
      (obj.fieldsets.length === 1 &&
        (obj.groups === undefined || (Array.isArray(obj.groups) && obj.groups.length <= 1))) ||
      obj.fieldsets.every(
        (fieldset: any) =>
          Object.values(fieldset).filter((v) => {
            return v !== undefined
          }).length <= 1,
      )
    ) {
      obj.fieldsets = undefined
    }
  }
}

function coerceTitles(obj: EncodableObject, titles: Record<string, string>) {
  for (const [jsonPath, title] of Object.entries(titles)) {
    // Parse path: "$.foo.bar[0].title" → ["foo", "bar", "0", "title"]
    const parts = jsonPath
      .slice(2)
      .split(/[.[\]]+/)
      .filter(Boolean)

    // Navigate to parent of target
    let current: EncodableValue | undefined = obj
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      const isIndex = /^\d+$/.test(part)

      if (isIndex && Array.isArray(current)) {
        current = current[+part]
      } else if (isRecord(current)) {
        current = current[part]
      } else {
        break // Path doesn't exist
      }
    }

    // Set title if undefined
    if (isRecord(current)) {
      const lastKey = parts[parts.length - 1]
      if (current[lastKey] === undefined) {
        current[lastKey] = title
      }
    }
  }
}

function unsetEmptyObjectsDeep(obj: unknown) {
  if (!isRecord(obj)) return

  for (const key of Object.keys(obj)) {
    unsetEmptyObjectsDeep(obj[key])

    if (isEmptyObject(obj[key])) {
      delete obj[key]
    }
  }
}

function normalizeOptions(obj: unknown) {
  if (!isRecord(obj) || !isRecord(obj.options)) return

  for (const key of Object.keys(obj.options)) {
    if (obj.options[key] === null) {
      delete obj.options[key]
    }
  }

  unsetEmptyObjectsDeep(obj.options)
  if (isEmptyObject(obj.options)) {
    obj.options = undefined
  }
}

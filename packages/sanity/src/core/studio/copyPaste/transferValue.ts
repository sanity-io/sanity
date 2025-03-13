/* eslint-disable max-statements */
/* eslint-disable complexity */
import {isAssetObjectStub, isFileAssetId, isImageAssetId} from '@sanity/asset-utils'
import {type SanityClient} from '@sanity/client'
import {
  type ArraySchemaType,
  type BooleanSchemaType,
  type ConditionalPropertyCallbackContext,
  type CurrentUser,
  isArrayOfObjectsSchemaType,
  isArrayOfPrimitivesSchemaType,
  isArraySchemaType,
  isBlockSchemaType,
  isFileSchemaType,
  isImageSchemaType,
  isIndexSegment,
  isIndexTuple,
  isKeySegment,
  isNumberSchemaType,
  isObjectSchemaType,
  isPortableTextSpan,
  isPortableTextTextBlock,
  isPrimitiveSchemaType,
  isReference,
  isReferenceSchemaType,
  isStringSchemaType,
  isTypedObject,
  type NumberSchemaType,
  type ObjectSchemaType,
  type Path,
  type SanityDocument,
  type SchemaType,
  type StringSchemaType,
  type TypedObject,
} from '@sanity/types'
import {last} from 'lodash'

import {getValueAtPath} from '../../field/paths/helpers'
import {type FIXME} from '../../FIXME'
import {resolveConditionalProperty} from '../../form/store/conditional-property/resolveConditionalProperty'
import {accepts} from '../../form/studio/uploads/accepts'
import {randomKey} from '../../form/utils/randomKey'
import {getIdPair} from '../../util/draftUtils'
import {isRecord} from '../../util/isRecord'
import {documentMatchesGroqFilter} from './documentMatchesGroqFilter'
import {resolveSchemaTypeForPath} from './resolveSchemaTypeForPath'
import {isEmptyValue} from './utils'

export interface TransferValueError {
  level: 'warning' | 'error'
  sourceValue: unknown

  i18n: {
    key: string
    args?: Record<string, unknown>
  }
}

function getObjectTypeFromPath(path: Path): string {
  if (path.length === 0) {
    return 'object'
  }

  const lastPathSegment = path[path.length - 1]

  if (
    isKeySegment(lastPathSegment) ||
    isIndexSegment(lastPathSegment) ||
    isIndexTuple(lastPathSegment)
  ) {
    return 'object'
  }

  return lastPathSegment
}

function isCompatiblePrimitiveType(value: unknown, targetJsonTypes: string[]): boolean {
  if (typeof value === 'string' && targetJsonTypes.includes('string')) {
    return true
  }

  // We allow putting numbers into string fields
  if (
    typeof value === 'number' &&
    (targetJsonTypes.includes('number') || targetJsonTypes.includes('string'))
  ) {
    return true
  }

  if (typeof value === 'boolean' && targetJsonTypes.includes('boolean')) {
    return true
  }

  return false
}

function isNumberToStringSchemaType(a: unknown, b: unknown): boolean {
  return (
    isRecord(a) &&
    isRecord(b) &&
    ((a.jsonType === 'number' && b.jsonType === 'string') ||
      isNumberToStringSchemaType(a.type, b.type))
  )
}

function arrayJsonTypes(schemaType: ArraySchemaType): string[] {
  return schemaType.of.map((type) => type.jsonType)
}

function isNumberToArrayOfStrings(a: unknown, b: unknown): boolean {
  return (
    isRecord(a) &&
    isRecord(b) &&
    ((a.jsonType === 'number' &&
      isArrayOfPrimitivesSchemaType(b) &&
      arrayJsonTypes(b).includes('string')) ||
      isNumberToArrayOfStrings(a.type, b.type))
  )
}

const defaultKeyGenerator = () => randomKey(12)

interface ClientWithFetch {
  fetch: <R = FIXME, Q = Record<string, unknown>>(query: string, params?: Q) => Promise<R>
}

export interface TransferValueOptions {
  validateReferences?: boolean
  validateAssets?: boolean
  client?: ClientWithFetch
}

/**
 * Takes the path and checks if any ancestor is read-only
 * ["a", "b", "c"] - ["a"], ["a", "b"], ["a", "b", "c"],
 */
function resolveReadOnlyAncestor({
  path,
  value,
  schemaType,
  currentUser,
}: {
  path: Path
  value?: unknown
  schemaType: SchemaType
  currentUser: CurrentUser | null
}): boolean {
  const isReadOnly = path.find((_, index) => {
    // Iterates on each of the path segments and checks if the current path is read-only
    const currentPath = path.slice(0, index + 1)
    const schemaTypeAtPath = resolveSchemaTypeForPath(schemaType, currentPath, value)
    if (!schemaTypeAtPath) {
      throw new Error(`Could not find target schema type at path ${path.join('.')}`)
    }
    return resolveConditionalProperty(schemaTypeAtPath.readOnly, {
      value,
      parent: null,
      document: value as ConditionalPropertyCallbackContext['document'],
      currentUser,
    })
  })

  return Boolean(isReadOnly)
}

// eslint-disable-next-line complexity, max-statements
export async function transferValue({
  sourceRootSchemaType,
  sourcePath,
  sourceValue,
  sourceRootPath = [],
  targetRootSchemaType,
  targetRootValue,
  targetRootPath,
  targetValue,
  targetPath,
  keyGenerator = defaultKeyGenerator,
  targetDocumentSchemaType,
  currentUser,
  options = {
    validateReferences: true,
    validateAssets: true,
    client: undefined,
  },
}: {
  sourceRootSchemaType: SchemaType
  sourcePath: Path
  sourceRootPath?: Path
  sourceValue: unknown
  targetRootSchemaType: SchemaType
  targetPath: Path
  targetRootValue?: unknown
  targetRootPath: Path
  targetValue?: unknown
  keyGenerator?: () => string
  currentUser: CurrentUser | null
  options?: TransferValueOptions
  targetDocumentSchemaType: SchemaType
}): Promise<{
  targetValue: unknown
  errors: TransferValueError[]
}> {
  const errors: TransferValueError[] = []

  if (!sourceRootSchemaType) {
    throw new Error('Source root schema type is not defined')
  }
  if (!targetRootSchemaType) {
    throw new Error('Target root schema type is not defined')
  }

  const sourceSchemaTypeAtPath = resolveSchemaTypeForPath(
    sourceRootSchemaType,
    sourcePath,
    sourceValue,
  )
  const targetSchemaTypeAtPath = resolveSchemaTypeForPath(
    targetRootSchemaType,
    targetPath,
    targetValue,
  )

  if (!sourceSchemaTypeAtPath) {
    throw new Error('Could not find source schema type at path')
  }
  if (!targetSchemaTypeAtPath) {
    throw new Error('Could not find target schema type at path')
  }

  const targetRootSchemaTypeReadOnly = resolveConditionalProperty(targetRootSchemaType.readOnly, {
    value: targetRootValue,
    parent: null,
    document: targetRootValue as ConditionalPropertyCallbackContext['document'],
    currentUser,
  })
  const targetSchemaTypeAtPathReadOnly = resolveConditionalProperty(
    targetSchemaTypeAtPath.readOnly,
    {
      value: targetValue,
      parent: null,
      document: targetRootValue as ConditionalPropertyCallbackContext['document'],
      currentUser,
    },
  )

  const isAncestorReadOnly = resolveReadOnlyAncestor({
    path: targetRootPath,
    value: targetRootValue,
    schemaType: targetDocumentSchemaType,
    currentUser,
  })

  if (targetRootSchemaTypeReadOnly || targetSchemaTypeAtPathReadOnly || isAncestorReadOnly) {
    return {
      targetValue: undefined,
      errors: [
        {
          level: 'error',
          sourceValue,

          i18n: {
            key: 'copy-paste.on-paste.validation.read-only-target.description',
          },
        },
      ],
    }
  }

  const isIncompatibleAssetSchemaType =
    (isFileSchemaType(sourceSchemaTypeAtPath) && isImageSchemaType(targetSchemaTypeAtPath)) ||
    (isImageSchemaType(sourceSchemaTypeAtPath) && isFileSchemaType(targetSchemaTypeAtPath))

  if (isIncompatibleAssetSchemaType) {
    return {
      targetValue: undefined,
      errors: [
        {
          level: 'error',
          sourceValue,

          i18n: {
            key: 'copy-paste.on-paste.validation.image-file-incompatible.description',
            args: {
              sourceSchemaType: sourceRootSchemaType.name,
              targetSchemaType: targetRootSchemaType.name,
            },
          },
        },
      ],
    }
  }

  // Generally we test that the target schema types are compatible with the source schema types
  // However we want to make some exceptions:
  // - Number to string is allowed
  // - Primitive values to array of primitives is allowed
  const sourceJsonType = sourceSchemaTypeAtPath.jsonType
  const targetJsonType = targetSchemaTypeAtPath.jsonType
  const lastSourcePathSegment = last(sourceRootPath)
  const isIndexSourcePathSegmentKey =
    typeof lastSourcePathSegment !== 'undefined' && isIndexSegment(lastSourcePathSegment)

  // Special handling for single primitive array items
  const isSourceSinglePrimitiveArrayItem =
    sourcePath.length === 0 &&
    sourceJsonType === 'array' &&
    !Array.isArray(sourceValue) &&
    isIndexSourcePathSegmentKey
  const isSourcePrimitive = ['number', 'string', 'boolean'].includes(sourceJsonType)
  const isPrimitiveSourceAndPrimitiveArrayTarget =
    (isSourcePrimitive || isSourceSinglePrimitiveArrayItem) &&
    isArrayOfPrimitivesSchemaType(targetSchemaTypeAtPath)
  const isObjectSourceAndArrayOfObjectsTarget =
    sourceJsonType === 'object' && isArrayOfObjectsSchemaType(targetSchemaTypeAtPath)
  const isCompatibleSchemaTypes =
    sourceJsonType === targetJsonType ||
    isNumberToStringSchemaType(sourceSchemaTypeAtPath, targetSchemaTypeAtPath) ||
    isNumberToArrayOfStrings(sourceSchemaTypeAtPath, targetSchemaTypeAtPath) ||
    isPrimitiveSourceAndPrimitiveArrayTarget ||
    isObjectSourceAndArrayOfObjectsTarget

  // Test that the target schematypes are compatible
  if (!isCompatibleSchemaTypes) {
    return {
      targetValue: undefined,
      errors: [
        {
          level: 'error',
          sourceValue,

          i18n: {
            key: 'copy-paste.on-paste.validation.schema-type-incompatible.description',
          },
        },
      ],
    }
  }

  const sourceValueAtPath = getValueAtPath(sourceValue as TypedObject, sourcePath)

  // Objects
  if (
    sourceSchemaTypeAtPath.jsonType === 'object' &&
    targetSchemaTypeAtPath.jsonType === 'object'
  ) {
    return collateObjectValue({
      sourceValue: sourceValueAtPath as TypedObject,
      targetSchemaType: targetSchemaTypeAtPath as ObjectSchemaType,
      targetRootValue,
      targetRootPath,
      targetPath: [],
      errors,
      keyGenerator,
      options,
    })
  }

  // Arrays
  if (sourceSchemaTypeAtPath.jsonType === 'array' && targetSchemaTypeAtPath.jsonType === 'array') {
    // There will be a mismatch between the sourceSchemaTypeAtPath (uses []) vs sourceValueAtPath (returns 'String')
    // when copying a single array item that is a primitive value. We will do an extra check here to make sure we
    // allow for this conversion
    // @todo Refactor sourcePath to allways be the relative or complete path
    const wrappedSourceValueAtPath =
      isSourceSinglePrimitiveArrayItem && !Array.isArray(sourceValueAtPath)
        ? [sourceValueAtPath]
        : sourceValueAtPath

    return collateArrayValue({
      sourceValue: wrappedSourceValueAtPath,
      targetSchemaType: targetSchemaTypeAtPath as ArraySchemaType,
      targetRootValue,
      targetRootPath,
      errors,
      options,
      keyGenerator,
    })
  }

  // If this is a primitive source and primitive array target OR an object source and array of objects target, we need to wrap the source value in an array
  if (isPrimitiveSourceAndPrimitiveArrayTarget || isObjectSourceAndArrayOfObjectsTarget) {
    // Here we check if the source value does not contain a type for some reason, or its the type "object". This happens if you copy a object into a array
    // Then we need to get the type from the path
    let objectType

    // Check if it's an object source with array of objects target
    // and the source value is a typed object with '_type' of 'object',
    // OR if the source value is not a typed object. This handles inline objects
    // where we need to pull the type from the path vs objects that includes a `_type` property
    // See test case: ./transferValue.test.ts#L771
    if (
      (isObjectSourceAndArrayOfObjectsTarget &&
        isTypedObject(sourceValueAtPath) &&
        sourceValueAtPath._type === 'object') ||
      !isTypedObject(sourceValueAtPath)
    ) {
      // In this case, determine the object type from the source root path
      objectType = getObjectTypeFromPath(sourceRootPath)
    } else if (isTypedObject(sourceValueAtPath)) {
      // If the source value is a typed object, use its '_type' property
      objectType = sourceValueAtPath._type
    } else {
      // Default case: if none of the above conditions are met, set type to 'object'
      objectType = 'object'
    }

    // If the source value is an object, we wrap it in an array
    const wrappedSourceValue =
      isObjectSourceAndArrayOfObjectsTarget && !Array.isArray(sourceValueAtPath)
        ? [{...(sourceValueAtPath as TypedObject), _type: objectType, _key: keyGenerator()}]
        : ([sourceValueAtPath] as unknown[])

    return collateArrayValue({
      sourceValue: Array.isArray(sourceValueAtPath) ? sourceValueAtPath : wrappedSourceValue,
      targetSchemaType: targetSchemaTypeAtPath as ArraySchemaType,
      targetRootValue,
      targetRootPath,
      errors,
      options,
      keyGenerator,
    })
  }

  // Primitives
  const primitiveSchemaType = targetSchemaTypeAtPath as
    | NumberSchemaType
    | StringSchemaType
    | BooleanSchemaType

  return collatePrimitiveValue({
    sourceValue: sourceValueAtPath as unknown,
    targetSchemaType: primitiveSchemaType,
    errors,
  })
}

async function collateObjectValue({
  sourceValue,
  targetSchemaType,
  targetPath,
  targetRootValue,
  targetRootPath,
  errors,
  keyGenerator,
  options,
}: {
  sourceValue: unknown
  targetSchemaType: ObjectSchemaType
  targetRootValue: unknown
  targetRootPath: Path
  targetPath: Path
  errors: TransferValueError[]
  keyGenerator: () => string
  options: TransferValueOptions
}) {
  if (isEmptyValue(sourceValue)) {
    return {
      targetValue: undefined,
      errors,
    }
  }
  const targetValue = {
    _type: targetSchemaType.name,
    ...(sourceValue && typeof sourceValue === 'object' && '_key' in sourceValue
      ? {_key: keyGenerator()}
      : {}),
  } as TypedObject

  const sourceValueRef =
    isAssetObjectStub(sourceValue) && isReference(sourceValue.asset)
      ? sourceValue.asset._ref
      : undefined
  const sourceValueType = isTypedObject(sourceValue) ? sourceValue._type : undefined
  const isImageRef = sourceValueRef && isImageAssetId(sourceValueRef)
  const isFileRef = sourceValueRef && isFileAssetId(sourceValueRef)
  const isIncompatibleImageRef =
    (sourceValueType === 'image' || isImageRef) && !isImageSchemaType(targetSchemaType)
  const isIncompatibleFileRef =
    (sourceValueType === 'file' || isFileRef) && !isFileSchemaType(targetSchemaType)
  // Special handling for image/file objects to ensure that you can't copy image into file and vice versa
  if (isTypedObject(sourceValue) && (isIncompatibleImageRef || isIncompatibleFileRef)) {
    errors.push({
      level: 'error',
      sourceValue,

      i18n: {
        key: 'copy-paste.on-paste.validation.image-file-incompatible.description',
        args: {
          sourceSchemaType: sourceValueType,
          targetSchemaType: targetSchemaType.name,
        },
      },
    })
    return {
      targetValue: undefined,
      errors,
    }
  }

  if (
    options?.validateAssets &&
    options.client &&
    (isImageSchemaType(targetSchemaType) || isFileSchemaType(targetSchemaType)) &&
    targetSchemaType.options?.accept &&
    isAssetObjectStub(sourceValue) &&
    isReference(sourceValue.asset)
  ) {
    const sourceRef = sourceValue.asset?._ref
    if (!sourceRef) {
      return {
        targetValue: undefined,
        errors,
      }
    }

    try {
      const assetType = isImageSchemaType(targetSchemaType)
        ? 'sanity.imageAsset'
        : 'sanity.fileAsset'
      const asset = await options.client.fetch(
        `*[_type == $type &&_id == $ref][0]{mimeType, originalFilename}`,
        {
          ref: sourceRef,
          type: assetType,
        },
      )

      if (!asset) {
        return {
          targetValue: undefined,
          errors,
        }
      }

      const fileLike = {
        type: asset.mimeType,
        name: asset.originalFilename,
      }
      const mimeType = asset.mimeType

      if (!accepts(fileLike, targetSchemaType.options.accept)) {
        errors.push({
          level: 'error',
          sourceValue,
          i18n: {
            key: 'copy-paste.on-paste.validation.mime-type-incompatible.description',
            args: {
              mimeType,
            },
          },
        })
        return {
          targetValue: undefined,
          errors,
        }
      }
    } catch (error) {
      console.error('Error fetching asset document:', error)
      errors.push({
        level: 'error',
        sourceValue,

        i18n: {
          key: 'copy-paste.on-paste.validation.mime-type-validation-failed.description',
        },
      })

      return {
        targetValue: undefined,
        errors,
      }
    }
  }

  // Validate reference types
  if (isReferenceSchemaType(targetSchemaType)) {
    const targetReferenceTypes = targetSchemaType.to.map((type) => type.name)

    // Validate the actual reference value
    if (options?.validateReferences && options.client && isReference(sourceValue)) {
      try {
        // We need to fetch the whole reference document if a filter is defined
        const query = targetSchemaType.options?.filter
          ? `*[_id in $ids]|order(_updatedAt)[0]`
          : `*[_id in $ids]|order(_updatedAt)[0]{_id, _type}`
        const {publishedId, draftId} = getIdPair(sourceValue._ref)
        const reference = await (options.client as SanityClient).fetch(query, {
          ids: [publishedId, draftId],
        })

        // Test that we have an actual referenced object if this is not a weak reference
        if (!reference && !targetSchemaType.weak) {
          errors.push({
            level: 'error',
            sourceValue: sourceValue,

            i18n: {
              key: 'copy-paste.on-paste.validation.reference-validation-failed.description',
              args: {
                ref: sourceValue._ref,
              },
            },
          })

          return {
            targetValue: undefined,
            errors,
          }
        }

        // Test that the actual referenced type is allowed by the schema.
        // This will not trigger if the reference does not exist
        if (reference && !targetReferenceTypes.includes(reference._type)) {
          errors.push({
            level: 'error',
            sourceValue: sourceValue,

            i18n: {
              key: 'copy-paste.on-paste.validation.reference-type-incompatible.description',
              args: {
                sourceReferenceType: reference._type,
                targetReferenceTypes: targetReferenceTypes.join(', '),
              },
            },
          })

          return {
            targetValue: undefined,
            errors,
          }
        }

        // Validate references against filter set on the target schema type
        if (options.client && targetSchemaType.options?.filter) {
          const getClient = (clientOptions: {apiVersion: string}) =>
            (options.client as SanityClient).withConfig(clientOptions)
          const isMatch = await documentMatchesGroqFilter(
            (targetRootValue || {}) as SanityDocument,
            reference,
            targetSchemaType.options,
            targetRootPath,
            getClient,
          )

          // eslint-disable-next-line max-depth
          if (!isMatch) {
            errors.push({
              level: 'error',
              sourceValue: sourceValue,

              i18n: {
                key: 'copy-paste.on-paste.validation.reference-filter-incompatible.description',
              },
            })

            return {
              targetValue: undefined,
              errors,
            }
          }
        }
      } catch (error) {
        console.error('Error fetching reference document:', error)
        errors.push({
          level: 'error',
          sourceValue: targetValue,

          i18n: {
            key: 'copy-paste.on-paste.validation.reference-validation-failed.description',
            args: {
              ref: sourceValue._ref,
            },
          },
        })

        return {
          targetValue: undefined,
          errors,
        }
      }
    }
  }

  const markDefKeyMap: Record<string, string> = {}
  const isPortableTextBlockWithMarkdefs =
    isBlockSchemaType(targetSchemaType) &&
    isPortableTextTextBlock(sourceValue) &&
    !isEmptyValue(sourceValue.markDefs)

  // Special handling for markDefs on block objects
  if (isPortableTextBlockWithMarkdefs) {
    // We want to generate a new key for each markDef preempetively
    const markDefs = sourceValue.markDefs || []

    // Map old to new markDef key
    markDefs
      .filter((item) => item._key)
      .forEach((item) => {
        markDefKeyMap[item._key] = keyGenerator()
      })

    targetValue.markDefs = markDefs.map((item) => ({
      ...item,
      _key: markDefKeyMap[item._key],
    }))
  }

  const objectMembers = targetSchemaType.fields

  for (const member of objectMembers) {
    const memberSchemaType = member.type
    const memberIsArray = isArraySchemaType(memberSchemaType)
    const memberIsObject = isObjectSchemaType(memberSchemaType)
    const memberIsPrimitive = isPrimitiveSchemaType(memberSchemaType)

    // Primitive field
    if (memberIsPrimitive) {
      const genericValue = sourceValue
        ? ((sourceValue as TypedObject)[member.name] as unknown)
        : undefined
      const collated = collatePrimitiveValue({
        sourceValue: genericValue,
        targetSchemaType: memberSchemaType,
        errors,
      })

      if (!isEmptyValue(collated.targetValue)) {
        targetValue[member.name] = collated.targetValue
      }

      // Object field
    } else if (memberIsObject) {
      const collated = await collateObjectValue({
        sourceValue: getValueAtPath(
          sourceValue as TypedObject,
          targetPath.concat(member.name),
        ) as TypedObject,
        targetPath: [],
        targetSchemaType: memberSchemaType,
        targetRootValue,
        targetRootPath,
        errors,
        options,
        keyGenerator,
      })

      if (!isEmptyValue(collated.targetValue)) {
        targetValue[member.name] = cleanObjectKeys(collated.targetValue as TypedObject)
      }

      // Array field
    } else if (memberIsArray) {
      const genericValue = sourceValue
        ? ((sourceValue as TypedObject)[member.name] as unknown)
        : undefined
      const collated = await collateArrayValue({
        sourceValue: genericValue,
        targetSchemaType: memberSchemaType as ArraySchemaType,
        targetRootValue,
        targetRootPath,
        errors,
        options,
        keyGenerator,
      })

      // Return early because we have set the markDefs one level up
      if (
        isPortableTextBlockWithMarkdefs &&
        member.name === 'markDefs' &&
        !isEmptyValue(targetValue.markDefs)
      ) {
        continue
      }

      if (!isEmptyValue(collated.targetValue)) {
        targetValue[member.name] = collated.targetValue
      }
    }
  }

  const valueAtTargetPath = getValueAtPath(targetValue, targetPath)
  const resultingValue = cleanObjectKeys(valueAtTargetPath as TypedObject)

  if (Object.keys(markDefKeyMap).length > 0 && isPortableTextTextBlock(resultingValue)) {
    // Now we need to update the _key references in the spans
    resultingValue.children = resultingValue.children.map((child) => {
      if (isPortableTextSpan(child) && child.marks) {
        return {
          ...child,
          marks: [...child.marks.map((markKey: string) => markDefKeyMap[markKey] || markKey)],
        }
      }
      return child
    })
  }

  // Special handling to avoid reference strength mismatches
  if (isReferenceSchemaType(targetSchemaType)) {
    if (targetSchemaType.weak) {
      resultingValue._weak = true
    } else {
      delete resultingValue._weak
    }
  }

  // Special handling for weak references that will be strengthened on publish
  if (
    isReferenceSchemaType(targetSchemaType) &&
    isReference(sourceValue) &&
    sourceValue._strengthenOnPublish
  ) {
    resultingValue._weak = true
    resultingValue._strengthenOnPublish = sourceValue._strengthenOnPublish
  }

  return {
    targetValue: resultingValue,
    errors,
  }
}

async function collateArrayValue({
  sourceValue,
  targetSchemaType,
  targetRootValue,
  targetRootPath,
  errors,
  options,
  keyGenerator,
}: {
  sourceValue: unknown
  targetRootValue: unknown
  targetRootPath: Path
  targetSchemaType: ArraySchemaType
  errors: TransferValueError[]
  options: TransferValueOptions
  keyGenerator: () => string
}): Promise<{
  targetValue: unknown
  errors: TransferValueError[]
}> {
  let targetValue: unknown[] | undefined = undefined

  const genericValue = sourceValue as unknown[]

  if (!genericValue || !Array.isArray(genericValue)) {
    return {
      targetValue: undefined,
      errors: [
        {
          level: 'error',
          sourceValue,

          i18n: {
            key: 'copy-paste.on-paste.validation.array-type-incompatible.description',
            args: {
              type: typeof genericValue,
            },
          },
        },
      ],
    }
  }

  const isArrayOfPrimitivesMember = isArrayOfPrimitivesSchemaType(targetSchemaType)
  const isArrayOfObjectsMember = isArrayOfObjectsSchemaType(targetSchemaType)

  // Primitive array
  if (isArrayOfPrimitivesMember) {
    const jsonTypes = targetSchemaType.of.map((type) => type.jsonType)

    // We allow converting numbers to string arrays
    const isNumberCompatible = jsonTypes.includes('number')
    const transferredItems = genericValue
      .filter((item) => isCompatiblePrimitiveType(item, jsonTypes))
      .map((item) => (!isNumberCompatible && typeof item === 'number' ? `${item}` : item))
    const nonTransferredItems = genericValue.filter(
      (item) =>
        !transferredItems.includes(
          !isNumberCompatible && typeof item === 'number' ? `${item}` : item,
        ),
    )
    if (nonTransferredItems.length > 0) {
      nonTransferredItems.forEach((item) => {
        errors.push({
          level: transferredItems.length > 0 ? 'warning' : 'error',
          sourceValue: item,

          i18n: {
            key: 'copy-paste.on-paste.validation.array-value-incompatible.description',
            args: {
              type: typeof item,
            },
          },
        })
      })
    }

    if (transferredItems.length > 0) {
      targetValue = transferredItems
    }
  }

  // Object array
  if (isArrayOfObjectsMember) {
    const value = sourceValue as TypedObject[]
    const transferredItems = value.filter((item) =>
      targetSchemaType.of.some((type) => type.name === item._type),
    )
    const nonTransferredItems = value.filter(
      (item) => !targetSchemaType.of.some((type) => type.name === item._type),
    )

    if (transferredItems.length === 0) {
      targetValue = undefined
    } else {
      const collatedItems = await Promise.all(
        transferredItems.map((item) =>
          collateObjectValue({
            sourceValue: item,
            targetSchemaType: targetSchemaType.of.find(
              (type) => type.name === item._type,
            )! as ObjectSchemaType,
            targetPath: [],
            targetRootValue,
            targetRootPath,
            errors,
            options,
            keyGenerator,
          }),
        ),
      )
      targetValue = collatedItems
        .map((item) => item.targetValue as TypedObject)
        .filter((item) => !isEmptyValue(item))
    }

    if (nonTransferredItems.length > 0) {
      nonTransferredItems.forEach((item) => {
        errors.push({
          level: transferredItems.length > 0 ? 'warning' : 'error',
          sourceValue: item,

          i18n: {
            key: 'copy-paste.on-paste.validation.array-value-incompatible.description',
            args: {
              type: item._type || typeof item,
            },
          },
        })
      })
    }
  }

  return {
    targetValue,
    errors,
  }
}

function collatePrimitiveValue({
  sourceValue,
  targetSchemaType,
  errors,
}: {
  sourceValue: unknown
  targetSchemaType: NumberSchemaType | StringSchemaType | BooleanSchemaType
  errors: TransferValueError[]
}): {
  targetValue: unknown
  errors: TransferValueError[]
} {
  let targetValue: unknown

  const primitiveValue = sourceValue as unknown
  if (typeof primitiveValue === 'undefined') {
    return {
      targetValue: undefined,
      errors,
    }
  }

  const isSamePrimitiveType = targetSchemaType.jsonType === typeof primitiveValue

  // We also allow numbers to be transferred to string fields
  const isNumberToString =
    typeof primitiveValue === 'number' && targetSchemaType.jsonType === 'string'

  if (isSamePrimitiveType || isNumberToString) {
    const isNumberOrString =
      typeof primitiveValue === 'string' || typeof primitiveValue === 'number'
    // Test that the primitive value is allowed if this is a string list schema type
    if (
      (isNumberSchemaType(targetSchemaType) || isStringSchemaType(targetSchemaType)) &&
      isNumberOrString
    ) {
      const allowedStrings =
        targetSchemaType.options?.list?.map((item) =>
          typeof item === 'string' || typeof item === 'number' ? item : item.value,
        ) || []

      if (allowedStrings.length > 0 && !allowedStrings.includes(primitiveValue)) {
        errors.push({
          level: 'error',
          sourceValue: primitiveValue,

          i18n: {
            key: 'copy-paste.on-paste.validation.string-value-incompatible.description',
            args: {
              value: primitiveValue,
              allowedStrings,
            },
          },
        })
      }
    }

    // Convert number to string if needed
    targetValue = isNumberToString ? `${primitiveValue}` : primitiveValue
  } else {
    errors.push({
      level: 'error',
      sourceValue: primitiveValue,

      i18n: {
        key: 'copy-paste.on-paste.validation.primitive-type-incompatible.description',
        args: {
          type: typeof primitiveValue,
        },
      },
    })
  }

  return {
    targetValue,
    errors,
  }
}

function cleanObjectKeys(obj: TypedObject): TypedObject {
  const disallowedKeys = ['_id', '_createdAt', '_updatedAt', '_rev']
  return Object.keys(obj).reduce((acc, key) => {
    if (disallowedKeys.includes(key)) {
      return acc
    }
    return {...acc, [key]: obj[key]}
  }, {}) as TypedObject
}

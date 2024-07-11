/* eslint-disable max-statements */
/* eslint-disable complexity */
import {isAssetObjectStub, isFileAssetId, isImageAssetId} from '@sanity/asset-utils'
import {
  type ArraySchemaType,
  type BooleanSchemaType,
  isArrayOfObjectsSchemaType,
  isArrayOfPrimitivesSchemaType,
  isArraySchemaType,
  isBlockSchemaType,
  isFileSchemaType,
  isImageSchemaType,
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
  type SanityDocument,
  type StringSchemaType,
  type TypedObject,
} from '@sanity/types'
import {
  type FIXME,
  getIdPair,
  isRecord,
  type Path,
  type SanityClient,
  type SchemaType,
} from 'sanity'

import {getValueAtPath} from '../../field/paths/helpers'
import {accepts} from '../../form/studio/uploads/accepts'
import {randomKey} from '../../form/utils/randomKey'
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

// eslint-disable-next-line complexity, max-statements
export async function transferValue({
  sourceRootSchemaType,
  sourcePath,
  sourceValue,
  targetRootSchemaType,
  targetRootValue,
  targetRootPath,
  targetValue,
  targetPath,
  keyGenerator = defaultKeyGenerator,
  options = {
    validateReferences: true,
    validateAssets: true,
    client: undefined,
  },
}: {
  sourceRootSchemaType: SchemaType
  sourcePath: Path
  sourceValue: unknown
  targetRootSchemaType: SchemaType
  targetPath: Path
  targetRootValue?: unknown
  targetRootPath: Path
  targetValue?: unknown
  keyGenerator?: () => string
  options?: TransferValueOptions
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

  if (targetRootSchemaType.readOnly || targetSchemaTypeAtPath.readOnly) {
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
  const isSourcePrimitive = ['number', 'string', 'boolean'].includes(sourceJsonType)
  const isPrimitiveSourceAndPrimitiveArrayTarget =
    isSourcePrimitive && isArrayOfPrimitivesSchemaType(targetSchemaTypeAtPath)
  const isCompatibleSchemaTypes =
    sourceJsonType === targetJsonType ||
    isNumberToStringSchemaType(sourceSchemaTypeAtPath, targetSchemaTypeAtPath) ||
    isNumberToArrayOfStrings(sourceSchemaTypeAtPath, targetSchemaTypeAtPath) ||
    isPrimitiveSourceAndPrimitiveArrayTarget

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
    return collateArrayValue({
      sourceValue: sourceValueAtPath as unknown[],
      targetSchemaType: targetSchemaTypeAtPath as ArraySchemaType,
      targetRootValue,
      targetRootPath,
      errors,
      keyGenerator,
    })
  }

  // If this is a primitive source and primitive array target, we need to wrap the source value in an array
  if (isPrimitiveSourceAndPrimitiveArrayTarget) {
    return collateArrayValue({
      sourceValue: [sourceValueAtPath] as unknown[],
      targetSchemaType: targetSchemaTypeAtPath as ArraySchemaType,
      targetRootValue,
      targetRootPath,
      errors,
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
  options?: TransferValueOptions
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
            },
          })

          return {
            targetValue: undefined,
            errors,
          }
        }

        // Test that the actual referenced type is allowed by the schema.
        if (!targetReferenceTypes.includes(reference._type)) {
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

  // Special handling for weak references
  if (isReferenceSchemaType(targetSchemaType) && targetSchemaType.weak) {
    resultingValue._weak = true
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
  keyGenerator,
}: {
  sourceValue: unknown
  targetRootValue: unknown
  targetRootPath: Path
  targetSchemaType: ArraySchemaType
  errors: TransferValueError[]
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
  const disallowedKeys = ['_id', '_createdAt', '_updatedAt', '_rev', '_weak']
  return Object.keys(obj).reduce((acc, key) => {
    if (disallowedKeys.includes(key)) {
      return acc
    }
    return {...acc, [key]: obj[key]}
  }, {}) as TypedObject
}

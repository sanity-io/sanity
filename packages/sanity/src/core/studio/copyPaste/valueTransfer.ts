import {isAssetObjectStub, isReference} from '@sanity/asset-utils'
import {
  type ArraySchemaType,
  type BooleanSchemaType,
  isArrayOfObjectsSchemaType,
  isArrayOfPrimitivesSchemaType,
  isArraySchemaType,
  isFileSchemaType,
  isImageSchemaType,
  isNumberSchemaType,
  isObjectSchemaType,
  isPrimitiveSchemaType,
  isReferenceSchemaType,
  isStringSchemaType,
  type NumberSchemaType,
  type ObjectSchemaType,
  type StringSchemaType,
  type TypedObject,
} from '@sanity/types'
import {type FIXME, isRecord, type Path, type SchemaType} from 'sanity'

import {getValueAtPath} from '../../field/paths/helpers'
import {accepts} from '../../form/studio/uploads/accepts'
import {randomKey} from '../../form/utils/randomKey'
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

function isEqualSchemaType(a: unknown, b: unknown): boolean {
  return isRecord(a) && isRecord(b) && (a.name === b.name || isEqualSchemaType(a.type, b.type))
}

function isCompatiblePrimitiveType(value: unknown, targetJsonTypes: string[]): boolean {
  if (typeof value === 'string' && targetJsonTypes.includes('string')) {
    return true
  }

  // We allow putting numbers into string fields
  if (
    (typeof value === 'number' && targetJsonTypes.includes('number')) ||
    targetJsonTypes.includes('string')
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
  keyGenerator?: () => string
  options?: TransferValueOptions
}): Promise<{
  targetValue: unknown
  errors: TransferValueError[]
}> {
  const errors: TransferValueError[] = []

  const sourceSchemaTypeAtPath = resolveSchemaTypeForPath(sourceRootSchemaType, sourcePath)
  const targetSchemaTypeAtPath = resolveSchemaTypeForPath(targetRootSchemaType, targetPath)

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
    // Special handling for reference objects to ensure that (some) common references exists
    // I think this is the best effort we can do without fetching and inspecting the actual referenced data
    if (
      isReferenceSchemaType(sourceSchemaTypeAtPath) &&
      isReferenceSchemaType(targetSchemaTypeAtPath)
    ) {
      const sourceReferenceTypes = sourceSchemaTypeAtPath.to.map((type) => type.name)
      const targetReferenceTypes = targetSchemaTypeAtPath.to.map((type) => type.name)

      if (!targetReferenceTypes.some((type) => sourceReferenceTypes.includes(type))) {
        errors.push({
          level: 'error',
          sourceValue,

          i18n: {
            key: 'copy-paste.on-paste.validation.reference-type-incompatible.description',
            args: {
              sourceReferenceTypes,
              targetReferenceTypes,
            },
          },
        })

        return {
          targetValue: undefined,
          errors,
        }
      }
    }

    // Special handling for image/file objects to ensure that you can't copy image into file and vice versa
    // I think this is the best effort we can do without fetching and inspecting the actual referenced data
    if (
      (isImageSchemaType(sourceSchemaTypeAtPath) || isFileSchemaType(sourceSchemaTypeAtPath)) &&
      !isEqualSchemaType(sourceSchemaTypeAtPath, targetSchemaTypeAtPath)
    ) {
      errors.push({
        level: 'error',
        sourceValue,

        i18n: {
          key: 'copy-paste.on-paste.validation.image-file-incompatible.description',
          args: {
            sourceSchemaType: sourceSchemaTypeAtPath.name,
            targetSchemaType: targetSchemaTypeAtPath.name,
          },
        },
      })
      return {
        targetValue: undefined,
        errors,
      }
    }

    // @todo Look up the file or image document if there is a option.accept rule on the targetSchema type,
    // and validate that the file/image is of the correct type based on the mimetype
    if (
      options.validateAssets &&
      options.client &&
      (isImageSchemaType(targetSchemaTypeAtPath) || isFileSchemaType(targetSchemaTypeAtPath)) &&
      targetSchemaTypeAtPath.options?.accept &&
      isAssetObjectStub(sourceValueAtPath) &&
      isReference(sourceValueAtPath.asset)
    ) {
      const sourceRef = sourceValueAtPath.asset?._ref
      if (!sourceRef) {
        return {
          targetValue: undefined,
          errors,
        }
      }

      try {
        const assetType = isImageSchemaType(targetSchemaTypeAtPath)
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

        if (!accepts(fileLike, targetSchemaTypeAtPath.options.accept)) {
          errors.push({
            level: 'error',
            sourceValue: sourceValueAtPath,
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
          sourceValue: sourceValueAtPath,

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

    return collateObjectValue({
      sourceValue: sourceValueAtPath as TypedObject,
      targetSchemaType: targetSchemaTypeAtPath as ObjectSchemaType,
      targetPath: [],
      errors,
      keyGenerator,
    })
  }

  // Arrays
  if (sourceSchemaTypeAtPath.jsonType === 'array' && targetSchemaTypeAtPath.jsonType === 'array') {
    return collateArrayValue({
      sourceValue: sourceValueAtPath as unknown[],
      targetSchemaType: targetSchemaTypeAtPath as ArraySchemaType,
      errors,
      keyGenerator,
    })
  }

  // If this is a primitive source and primitive array target, we need to wrap the source value in an array
  if (isPrimitiveSourceAndPrimitiveArrayTarget) {
    return collateArrayValue({
      sourceValue: [sourceValueAtPath] as unknown[],
      targetSchemaType: targetSchemaTypeAtPath as ArraySchemaType,
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

function collateObjectValue({
  sourceValue,
  targetSchemaType,
  targetPath,
  errors,
  keyGenerator,
}: {
  sourceValue: unknown
  targetSchemaType: ObjectSchemaType
  targetPath: Path
  errors: TransferValueError[]
  keyGenerator: () => string
}) {
  if (isEmptyValue(sourceValue)) {
    return {
      targetValue: undefined,
      errors,
    }
  }
  if (targetSchemaType.readOnly) {
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

  const objectMembers = targetSchemaType.fields

  objectMembers.forEach((member) => {
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
      const collated = collateObjectValue({
        sourceValue: getValueAtPath(
          sourceValue as TypedObject,
          targetPath.concat(member.name),
        ) as TypedObject,
        targetPath: [],
        targetSchemaType: memberSchemaType,
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
      const collated = collateArrayValue({
        sourceValue: genericValue,
        targetSchemaType: memberSchemaType as ArraySchemaType,
        errors,
        keyGenerator,
      })
      if (!isEmptyValue(collated.targetValue)) {
        targetValue[member.name] = collated.targetValue
      }
    }
  })

  const valueAtTargetPath = getValueAtPath(targetValue, targetPath)
  const resultingValue = cleanObjectKeys(valueAtTargetPath as TypedObject)

  // Special handling for weak references
  if (isReferenceSchemaType(targetSchemaType) && targetSchemaType.weak) {
    resultingValue._weak = true
  }

  return {
    targetValue: resultingValue,
    errors,
  }
}

function collateArrayValue({
  sourceValue,
  targetSchemaType,
  errors,
  keyGenerator,
}: {
  sourceValue: unknown
  targetSchemaType: ArraySchemaType
  errors: TransferValueError[]
  keyGenerator: () => string
}): {
  targetValue: unknown
  errors: TransferValueError[]
} {
  if (targetSchemaType.readOnly) {
    return {
      targetValue: undefined,
      errors,
    }
  }

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

    targetValue =
      transferredItems.length > 0
        ? transferredItems
            .map((item) => {
              const collated = collateObjectValue({
                sourceValue: item,
                targetSchemaType: targetSchemaType.of.find(
                  (type) => type.name === item._type,
                )! as ObjectSchemaType,
                targetPath: [],
                errors,
                keyGenerator,
              })
              return collated.targetValue
            })
            .filter((item) => !isEmptyValue(item))
        : undefined

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
  if (targetSchemaType.readOnly) {
    return {
      targetValue: undefined,
      errors,
    }
  }

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

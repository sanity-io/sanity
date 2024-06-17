import {
  type ArraySchemaType,
  type BooleanSchemaType,
  isArrayOfObjectsSchemaType,
  isArrayOfPrimitivesSchemaType,
  isArraySchemaType,
  isObjectSchemaType,
  isPrimitiveSchemaType,
  isReferenceSchemaType,
  type NumberSchemaType,
  type ObjectSchemaType,
  type StringSchemaType,
  type TypedObject,
} from '@sanity/types'
import {type Path, type SchemaType} from 'sanity'

import {getValueAtPath} from '../../field/paths/helpers'
import {randomKey} from '../../form/utils/randomKey'
import {isEmptyValue, tryResolveSchemaTypeForPath} from './utils'

export interface TransferValueError {
  level: 'warning' | 'error'
  message: string
  sourceValue: unknown
}

const defaultKeyGenerator = () => randomKey(12)

export function transferValue({
  sourceRootSchemaType,
  sourcePath,
  sourceValue,
  targetRootSchemaType,
  targetPath,
  keyGenerator = defaultKeyGenerator,
}: {
  sourceRootSchemaType: SchemaType
  sourcePath: Path
  sourceValue: unknown
  targetRootSchemaType: SchemaType
  targetPath: Path
  keyGenerator?: () => string
}): {
  targetValue: unknown
  errors: TransferValueError[]
} {
  const errors: TransferValueError[] = []

  const sourceSchemaTypeAtPath = tryResolveSchemaTypeForPath(sourceRootSchemaType, sourcePath)
  const targetSchemaTypeAtPath = tryResolveSchemaTypeForPath(targetRootSchemaType, targetPath)

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
          message: `The target is read-only`,
          sourceValue,
        },
      ],
    }
  }

  // Test that the target schematypes are compatible
  if (
    sourceSchemaTypeAtPath &&
    targetSchemaTypeAtPath &&
    sourceSchemaTypeAtPath.jsonType !== targetSchemaTypeAtPath.jsonType
  ) {
    return {
      targetValue: undefined,
      errors: [
        {
          level: 'error',
          message: 'Source and target schema types are not compatible',
          sourceValue,
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
    // I think this is the best effort we can do without fetching and inspecting the actual referenced data,
    if (
      isReferenceSchemaType(sourceSchemaTypeAtPath) &&
      isReferenceSchemaType(targetSchemaTypeAtPath)
    ) {
      const sourceReferenceTypes = sourceSchemaTypeAtPath.to.map((type) => type.name)
      const targetReferenceTypes = targetSchemaTypeAtPath.to.map((type) => type.name)
      if (!targetReferenceTypes.some((type) => sourceReferenceTypes.includes(type))) {
        errors.push({
          level: 'error',
          message: `References of type ${sourceReferenceTypes.join(', ')} is not allowed in reference field to types ${sourceReferenceTypes.join(', ')}`,
          sourceValue,
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
  return {
    targetValue: cleanObjectKeys(valueAtTargetPath as TypedObject),
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
          message: `Value of type ${typeof genericValue}, is not allowed in this array field`,
          sourceValue,
        },
      ],
    }
  }
  const isArrayOfPrimitivesMember = isArrayOfPrimitivesSchemaType(targetSchemaType)
  const isArrayOfObjectsMember = isArrayOfObjectsSchemaType(targetSchemaType)

  // Primitive array
  if (isArrayOfPrimitivesMember) {
    const transferredItems = genericValue.filter(
      (item) =>
        (typeof item === 'number' &&
          targetSchemaType.of.map((type) => type.jsonType).includes('number')) ||
        (typeof item === 'string' &&
          targetSchemaType.of.map((type) => type.jsonType).includes('string')) ||
        (typeof item === 'boolean' &&
          targetSchemaType.of.map((type) => type.jsonType).includes('boolean')),
    )
    const nonTransferredItems = genericValue.filter((item) => !transferredItems.includes(item))
    if (nonTransferredItems.length > 0) {
      nonTransferredItems.forEach((item) => {
        errors.push({
          level: transferredItems.length > 0 ? 'warning' : 'error',
          message: `Value of type ${typeof item}, is not allowed in this array field`,
          sourceValue: item,
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
        ? transferredItems.map((item) => {
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
        : undefined
    if (nonTransferredItems.length > 0) {
      nonTransferredItems.forEach((item) => {
        errors.push({
          level: transferredItems.length > 0 ? 'warning' : 'error',
          message: `Value of type '${item._type || typeof item}' is not allowed in this array field`,
          sourceValue: item,
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
  if (isSamePrimitiveType) {
    // Test that the primitive value is allowed if this is a string list schema type
    if (targetSchemaType.jsonType === 'string' && typeof primitiveValue === 'string') {
      const allowedStrings =
        targetSchemaType.options?.list?.map((item) =>
          typeof item === 'string' ? item : item.value,
        ) || []
      if (allowedStrings.length > 0 && !allowedStrings.includes(primitiveValue)) {
        errors.push({
          level: 'error',
          message: `Value '${primitiveValue}' is not allowed in ${targetSchemaType.title || targetSchemaType.name}`,
          sourceValue: primitiveValue,
        })
      }
    }
    targetValue = primitiveValue
  } else {
    errors.push({
      level: 'error',
      message: `Value of type ${typeof primitiveValue}, is not allowed in this field`,
      sourceValue: primitiveValue,
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

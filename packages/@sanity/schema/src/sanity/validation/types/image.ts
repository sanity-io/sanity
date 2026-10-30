import {error, HELP_IDS, warning} from '../createValidationResult'
import {validateField, validateFields} from './object'

const autoMeta = ['dimensions', 'hasAlpha', 'isOpaque']

interface Dimensions {
  width: number
  height: number
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isAspectRatioRange(value: unknown): boolean {
  if (value && typeof value === 'object' && 'min' in value && 'max' in value) {
    const {min, max} = value
    return isPositiveFiniteNumber(min) && isPositiveFiniteNumber(max) && min <= max
  }
  return false
}

function isValidAspectRatio(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0 && value.every(isPositiveFiniteNumber)
  }
  return isPositiveFiniteNumber(value) || isAspectRatioRange(value)
}

function isValidDimensions(value: unknown): value is Dimensions {
  if (value && typeof value === 'object' && 'width' in value && 'height' in value) {
    return isPositiveFiniteNumber(value.width) && isPositiveFiniteNumber(value.height)
  }
  return false
}

function isSetButInvalid(value: unknown, isValid: (candidate: unknown) => boolean): boolean {
  if (value === undefined || isValid(value)) {
    return false
  }
  return true
}

function validateCropOptions(options: Record<string, unknown> | undefined) {
  const {aspectRatio, minDimensions, recommendedDimensions} = options ?? {}
  const invalidAspectRatio = isSetButInvalid(aspectRatio, isValidAspectRatio)
    ? [
        error(
          'Invalid image `options.aspectRatio` - must be a positive number (`16 / 9`), a `{min, max}` range of positive numbers with `min` no greater than `max`, or a non-empty array of positive numbers',
        ),
      ]
    : []
  const invalidDimensions = Object.entries({minDimensions, recommendedDimensions})
    .filter(([, dimensions]) => isSetButInvalid(dimensions, isValidDimensions))
    .map(([name]) =>
      error(
        `Invalid image \`options.${name}\` - must be an object with a positive \`width\` and \`height\` in pixels`,
      ),
    )
  const recommendedBelowMinimum =
    isValidDimensions(minDimensions) &&
    isValidDimensions(recommendedDimensions) &&
    (recommendedDimensions.width < minDimensions.width ||
      recommendedDimensions.height < minDimensions.height)
      ? [
          warning(
            'Image `options.recommendedDimensions` should be at least as large as `options.minDimensions` on both axes',
          ),
        ]
      : []
  return [...invalidAspectRatio, ...invalidDimensions, ...recommendedBelowMinimum]
}

export default (typeDef: any, visitorContext: any) => {
  const problems = []
  const fields = typeDef.fields

  if (fields) {
    problems.push(...validateFields(fields, {allowEmpty: true}))
  }

  let options = typeDef.options
  const metadata = options?.metadata
  const superfluousMeta = Array.isArray(metadata)
    ? metadata.filter((meta) => autoMeta.includes(meta))
    : []

  const invalidFieldNames = ['asset', 'hotspot', 'crop']

  const fieldsWithInvalidName = Array.isArray(fields)
    ? fields?.filter((field) => invalidFieldNames.includes(field.name))
    : []

  if (typeof metadata !== 'undefined' && !Array.isArray(metadata)) {
    problems.push(
      error(
        `Invalid type for image \`metadata\` field - must be an array of strings`,
        HELP_IDS.ASSET_METADATA_FIELD_INVALID,
      ),
    )
  } else if (superfluousMeta.length > 0) {
    problems.push(
      warning(
        `Image \`metadata\` field contains superfluous properties (they are always included): ${superfluousMeta.join(
          ', ',
        )}`,
      ),
    )
    options = {...options, metadata: metadata!.filter((meta) => !autoMeta.includes(meta))}
  } else if (fieldsWithInvalidName.length > 0) {
    problems.push(
      error(
        `The names \`${invalidFieldNames.join(
          '`, `',
        )}\` are invalid field names for type \`image\`.`,
      ),
    )
  }

  problems.push(...validateCropOptions(options))

  return {
    ...typeDef,
    options,
    fields: (Array.isArray(fields) ? fields : []).map((field, index) => {
      const {name, ...fieldTypeDef} = field
      const {_problems, ...fieldType} = visitorContext.visit(fieldTypeDef, index)
      return {
        name,
        ...fieldType,
        _problems: validateField(field, visitorContext).concat(_problems || []),
      }
    }),
    _problems: problems,
  }
}

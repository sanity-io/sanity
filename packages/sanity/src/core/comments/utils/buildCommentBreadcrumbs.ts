import {
  SchemaType,
  ObjectField,
  isObjectSchemaType,
  CurrentUser,
  ArraySchemaType,
  ConditionalPropertyCallbackContext,
  ObjectSchemaType,
  ObjectFieldType,
  PathSegment,
} from '@sanity/types'
import {findIndex} from 'lodash'
import * as PathUtils from '@sanity/util/paths'
import {SanityDocument} from '@sanity/client'
import {getValueAtPath} from '../../field'
import {getSchemaTypeTitle} from '../../schema'
import {CommentBreadcrumbs} from '../types'
import {resolveConditionalProperty} from '../../form/store/conditional-property'

function getSchemaField(
  schemaType: SchemaType,
  fieldPath: string,
): ObjectField<SchemaType> | undefined {
  const paths = PathUtils.fromString(fieldPath)
  const firstPath = paths[0]

  if (firstPath && isObjectSchemaType(schemaType)) {
    const field = schemaType?.fields?.find((f) => f.name === firstPath)

    if (field) {
      const nextPath = PathUtils.toString(paths.slice(1))

      if (nextPath) {
        return getSchemaField(field.type, nextPath)
      }

      return field
    }
  }

  return undefined
}

function findArrayItemIndex(array: unknown[], pathSegment: PathSegment): number | false {
  if (typeof pathSegment === 'number') {
    return pathSegment
  }
  const index = findIndex(array, pathSegment)
  return index === -1 ? false : index
}

interface BuildCommentBreadcrumbsProps {
  documentValue: Partial<SanityDocument> | null
  fieldPath: string
  schemaType: SchemaType
  currentUser: CurrentUser
}

/**
 * @beta
 * @hidden
 *
 *  This function builds a breadcrumb trail for a given comment using its field path.
 *  It will validate each segment of the path against the document value and/or schema type.
 *  The path is invalid if:
 * - The field is hidden by a conditional field
 * - The field is not found in the schema type
 * - The field is not found in the document value (array items only)
 */
export function buildCommentBreadcrumbs(props: BuildCommentBreadcrumbsProps): CommentBreadcrumbs {
  const {currentUser, schemaType, fieldPath, documentValue} = props
  const paths = PathUtils.fromString(fieldPath)
  const fieldPaths: CommentBreadcrumbs = []

  let currentSchemaType: ArraySchemaType<SchemaType> | ObjectFieldType<SchemaType> | null = null

  paths.forEach((seg, index) => {
    const currentPath = paths.slice(0, index + 1)
    const previousPath = paths.slice(0, index)

    const field = getSchemaField(schemaType, PathUtils.toString(currentPath))
    const isKeySegment = seg.hasOwnProperty('_key')

    const parentValue = getValueAtPath(documentValue, previousPath)
    const currentValue = getValueAtPath(documentValue, currentPath)

    const conditionalContext: ConditionalPropertyCallbackContext = {
      document: documentValue as SanityDocument,
      currentUser,
      parent: parentValue,
      value: currentValue,
    }

    if (isKeySegment) {
      const previousValue = getValueAtPath(documentValue, previousPath) as unknown[]
      const arrayItemIndex = findArrayItemIndex(previousValue, seg)

      fieldPaths.push({
        invalid: arrayItemIndex === false,
        isArrayItem: true,
        title: `#${Number(arrayItemIndex) + 1}`,
      })

      return
    }

    if (field?.type) {
      const hidden = resolveConditionalProperty(field.type.hidden, conditionalContext)

      fieldPaths.push({
        invalid: hidden,
        isArrayItem: false,
        title: getSchemaTypeTitle(field.type),
      })

      currentSchemaType = field.type

      return
    }

    if (currentSchemaType?.jsonType === 'array') {
      const arrayValue: any = getValueAtPath(documentValue, previousPath)
      const objectType = arrayValue?._type

      const objectField = currentSchemaType?.of?.find(
        (type) => type.name === objectType,
      ) as ObjectSchemaType

      const currentField = objectField?.fields?.find(
        (f) => f.name === seg,
      ) as ObjectField<SchemaType>

      if (!currentField) {
        fieldPaths.push({
          invalid: true,
          isArrayItem: false,
          title: 'Unknown field',
        })

        return
      }

      const currentTitle = getSchemaTypeTitle(currentField?.type)

      const objectFieldHidden = resolveConditionalProperty(
        objectField?.type?.hidden,
        conditionalContext,
      )

      const currentFieldHidden = resolveConditionalProperty(
        currentField?.type.hidden,
        conditionalContext,
      )

      const isHidden = objectFieldHidden || currentFieldHidden

      fieldPaths.push({
        invalid: isHidden,
        isArrayItem: false,
        title: currentTitle,
      })

      currentSchemaType = currentField?.type

      return
    }

    // If we get here, the field is not found in the schema type
    // or the document value so we'll mark it as invalid.
    fieldPaths.push({
      invalid: true,
      isArrayItem: false,
      title: 'Unknown field',
    })
  })

  return fieldPaths
}

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
  isArraySchemaType,
} from '@sanity/types'
import {findIndex} from 'lodash'
import * as PathUtils from '@sanity/util/paths'
import {SanityDocument} from '@sanity/client'
import {CommentListBreadcrumbs} from '../types'
import {getSchemaTypeTitle, getValueAtPath, resolveConditionalProperty} from 'sanity'

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
export function buildCommentBreadcrumbs(
  props: BuildCommentBreadcrumbsProps,
): CommentListBreadcrumbs {
  const {currentUser, schemaType, fieldPath, documentValue} = props
  const paths = PathUtils.fromString(fieldPath)
  const fieldPaths: CommentListBreadcrumbs = []

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

    // If the field is a key segment and the parent value is an array, we'll
    // try to find the index of the array item in the parent value.
    // If the index is not found, we'll mark it as invalid.
    // This can happen if the array item has been removed from the document value.
    if (isKeySegment && Array.isArray(parentValue)) {
      const arrayItemIndex = findArrayItemIndex(parentValue, seg)

      const isNumber = typeof arrayItemIndex === 'number'

      fieldPaths.push({
        invalid: arrayItemIndex === false,
        isArrayItem: true,
        title: isNumber ? `#${Number(arrayItemIndex) + 1}` : 'Unknown array item',
      })

      return
    }

    // If we find a field in the schema type, we'll add it to the breadcrumb trail.
    if (field?.type) {
      const hidden = resolveConditionalProperty(field.type.hidden, conditionalContext)

      fieldPaths.push({
        invalid: hidden,
        isArrayItem: false,
        title: getSchemaTypeTitle(field.type),
      })

      // Store the current schema type so we can use it in the next iteration.
      currentSchemaType = field.type

      return
    }

    if (isArraySchemaType(currentSchemaType)) {
      // Get the value of the array field in the document value
      const arrayValue: any = getValueAtPath(documentValue, previousPath)

      // Get the object type of the array field in the schema type
      // from the array field's `_type` property in the document value.
      const objectType = arrayValue?._type

      // Find the object field in the array field's `of` array using
      // the object type from the document value.
      const objectField = currentSchemaType?.of?.find(
        (type) => type.name === objectType,
      ) as ObjectSchemaType

      // Find the field in the object field's `fields` array
      // using the field name from the path segment.
      const currentField = objectField?.fields?.find(
        (f) => f.name === seg,
      ) as ObjectField<SchemaType>

      // If we don't find the object field, we'll mark it as invalid.
      // This can happen if the object field has been removed from the schema type.
      if (!currentField) {
        fieldPaths.push({
          invalid: true,
          isArrayItem: false,
          title: 'Unknown field',
        })

        return
      }

      // Get the title of the current field
      const currentTitle = getSchemaTypeTitle(currentField?.type)

      // Resolve the hidden property of the object field
      const objectFieldHidden = resolveConditionalProperty(
        objectField?.type?.hidden,
        conditionalContext,
      )

      // Resolve the hidden property of the current field
      const currentFieldHidden = resolveConditionalProperty(
        currentField?.type.hidden,
        conditionalContext,
      )

      // If the object field or the current field is hidden, we'll mark it as invalid.
      const isHidden = objectFieldHidden || currentFieldHidden

      // Add the field to the breadcrumb trail
      fieldPaths.push({
        invalid: isHidden,
        isArrayItem: false,
        title: currentTitle,
      })

      // If the current field is an object field, we'll set it as the current schema type
      // so we can use it in the next iteration.
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

import {SchemaType, ObjectField, isObjectSchemaType} from '@sanity/types'
import {findIndex, startCase} from 'lodash'
import * as PathUtils from '@sanity/util/paths'
import {getValueAtPath} from '../../field'
import {getSchemaTypeTitle} from '../../schema'
import {CommentBreadcrumbs} from '../types'

function getSchemaField(
  schemaType: SchemaType,
  fieldPath: string,
): ObjectField<SchemaType> | undefined {
  const paths = PathUtils.fromString(fieldPath)
  const firstPath = paths[0]

  if (firstPath && isObjectSchemaType(schemaType)) {
    const field = schemaType.fields.find((f) => f.name === firstPath)

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

function findArrayItemIndex(array: unknown[], pathSegment: any): number | false {
  if (typeof pathSegment === 'number') {
    return pathSegment
  }
  const index = findIndex(array, pathSegment)
  return index === -1 ? false : index
}

interface BuildCommentBreadcrumbsProps {
  documentValue: unknown
  fieldPath: string
  schemaType: SchemaType
}

/**
 * @beta
 * @hidden
 */
export function buildCommentBreadcrumbs(props: BuildCommentBreadcrumbsProps): CommentBreadcrumbs {
  const {schemaType, fieldPath, documentValue} = props
  const paths = PathUtils.fromString(fieldPath)
  const fieldPaths: CommentBreadcrumbs = []

  paths.forEach((seg, index) => {
    const currentPath = PathUtils.toString(paths.slice(0, index + 1))
    const isArraySegment = seg.hasOwnProperty('_key')
    const field = getSchemaField(schemaType, currentPath)

    if (field) {
      const title = getSchemaTypeTitle(field?.type)

      fieldPaths.push({
        invalid: false,
        isArrayItem: false,
        title,
      })

      return
    }

    if (isArraySegment) {
      const previousPath = paths.slice(0, index)
      const valueAtPath = getValueAtPath(documentValue, previousPath) as unknown[]
      const arrayItemIndex = findArrayItemIndex(valueAtPath, seg)

      fieldPaths.push({
        invalid: arrayItemIndex === false,
        isArrayItem: true,
        title: `#${Number(arrayItemIndex) + 1}`,
      })

      return
    }

    // This is usually the schema definition of an array item (ie inside of: []).
    // todo: fix so that we get the defined titled instead of the field name.
    // We need to add support for it in `getSchemaField`.
    if (!isArraySegment) {
      fieldPaths.push({
        invalid: false,
        isArrayItem: false,
        title: startCase(seg.toString()),
      })
    }
  })

  return fieldPaths
}

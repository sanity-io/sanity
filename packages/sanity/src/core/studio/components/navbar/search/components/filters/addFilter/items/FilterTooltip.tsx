import {Card, Code, Flex, Inline, Label, Stack, Text, Tooltip} from '@sanity/ui'
import {startCase, uniq} from 'lodash'
import React, {ReactElement, useMemo} from 'react'
import {useSchema} from '../../../../../../../../hooks'
import {isNonNullable} from '../../../../../../../../util'
import {useSearchState} from '../../../../contexts/search/useSearchState'
import type {SearchFilterDefinition} from '../../../../definitions/filters'
import type {SearchFieldDefinition} from '../../../../types'
import {getSchemaField} from '../../../../utils/getSchemaField'
import {sanitizeFieldValue} from '../../../../utils/sanitizeField'

interface FilterTooltipProps {
  children: ReactElement
  fieldDefinition?: SearchFieldDefinition
  filterDefinition: SearchFilterDefinition
  visible?: boolean
}

const MAX_VISIBLE_TYPES = 10

export function FilterTooltip({
  children,
  fieldDefinition,
  filterDefinition,
  visible,
}: FilterTooltipProps) {
  const {
    state: {documentTypesNarrowed},
  } = useSearchState()

  const schema = useSchema()

  const fieldDefinitionDocumentTypeTitles = useMemo(() => {
    if (fieldDefinition?.documentTypes) {
      return fieldDefinition.documentTypes
        .map((d) => {
          const defType = schema.get(d)
          return defType?.title || startCase(defType?.name)
        })
        .filter(isNonNullable)
        .sort()
    }
    return []
  }, [fieldDefinition?.documentTypes, schema])

  /**
   * Obtain the shared field description for the current field definition.
   * Return a description only if this field description is identical (and defined)
   * across all ALL associated fields.
   */
  const fieldDefinitionDescription = useMemo(() => {
    if (fieldDefinition?.documentTypes) {
      const descriptions = fieldDefinition.documentTypes
        .map((d) => {
          const defType = schema.get(d)
          if (defType) {
            const field = getSchemaField(defType, fieldDefinition.fieldPath)
            // Sanitize schema descriptions (which may either be a string or React element)
            return field?.type.description && sanitizeFieldValue(field?.type.description)
          }
          return null
        })
        .filter(isNonNullable)
        .sort()

      const uniqueDescriptions = uniq(descriptions)
      if (uniqueDescriptions.length === 1) {
        return uniqueDescriptions[0]
      }
    }
    return undefined
  }, [fieldDefinition?.documentTypes, fieldDefinition?.fieldPath, schema])

  return (
    <Tooltip
      content={
        <Card tone="default" radius={2} style={{maxWidth: '250px'}}>
          <Stack padding={3} space={4}>
            {/* Field name */}
            {fieldDefinition && (
              <Stack space={2}>
                <Label muted size={0}>
                  Field name
                </Label>
                <Inline>
                  <Card tone="caution" padding={1} radius={2}>
                    <Code size={0}>{fieldDefinition?.name}</Code>
                  </Card>
                </Inline>
              </Stack>
            )}

            {/* Field description */}
            {fieldDefinitionDescription && (
              <Stack space={3}>
                <Label muted size={0}>
                  Field description
                </Label>
                <Text muted size={0}>
                  {truncateString(fieldDefinitionDescription)}
                </Text>
              </Stack>
            )}

            {/* Filter description */}
            {filterDefinition?.description && (
              <Text muted size={0}>
                {truncateString(filterDefinition.description)}
              </Text>
            )}

            {/* Field document titles */}
            {!documentTypesNarrowed.length && fieldDefinitionDocumentTypeTitles.length > 0 && (
              <Stack space={2}>
                <Flex align="center" gap={1}>
                  <Label muted size={0}>
                    Used in document types
                  </Label>
                  <Card padding={1} radius={2} tone="transparent">
                    <Text size={0} muted>
                      {fieldDefinitionDocumentTypeTitles.length}
                    </Text>
                  </Card>
                </Flex>
                <Text size={0} weight="regular" muted>
                  {fieldDefinitionDocumentTypeTitles.slice(0, MAX_VISIBLE_TYPES).join(', ')}
                  {fieldDefinitionDocumentTypeTitles?.length > MAX_VISIBLE_TYPES
                    ? ` +${fieldDefinitionDocumentTypeTitles.length - MAX_VISIBLE_TYPES} more`
                    : ''}
                </Text>
              </Stack>
            )}
          </Stack>
        </Card>
      }
      disabled={!visible}
      fallbackPlacements={['left']}
      placement="right"
      portal
    >
      {children}
    </Tooltip>
  )
}

function truncateString(str: string, maxLength = 256) {
  return str.length > maxLength ? `${str.slice(0, maxLength - 1)}…` : str
}

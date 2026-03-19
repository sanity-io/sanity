import {InfoOutlineIcon} from '@sanity/icons'
import {type ObjectSchemaType} from '@sanity/types'
import {Heading, Inline, Stack, Text} from '@sanity/ui'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {assignInlineVars} from '@vanilla-extract/dynamic'

import {Tooltip} from '../../../../../ui-components'
import {structureLocaleNamespace} from '../../../../i18n'
import {
  titleContainer,
  headingSize4FontSize,
  headingSize4LineHeight,
  headingSize3FontSize,
  headingSize3LineHeight,
  headingSize2FontSize,
  headingSize2LineHeight,
} from './FormHeader.css'

interface DocumentHeaderProps {
  documentId: string
  schemaType: ObjectSchemaType
  title?: string
}

/**
 * Use CSS container queries to conditionally render headings at different sizes.
 * We hide this entire container (including the document type) if container queries
 * not supported in the current browser.
 *
 * Note that usage of container queries in `styled-components` is only supported in `6.x`.
 * As such, studios that include `"styled-components": "<6"` as a dependency will only see
 * the largest heading size here, even if their browser supports it!
 */

/**
 * Header containing current document title and type.
 * Document type is hidden if the document `_id` matches the current document `_type`.
 * The entire header is hidden if container queries are not supported.
 */
export const FormHeader = ({documentId, schemaType, title}: DocumentHeaderProps) => {
  const isSingleton = documentId === schemaType.name
  const description = schemaType.description
  const {t} = useTranslation(structureLocaleNamespace)
  const {font} = useThemeV2()

  if (schemaType.__experimental_formPreviewTitle === false) {
    return null
  }
  return (
    <Stack
      className={titleContainer}
      marginBottom={6}
      space={4}
      style={assignInlineVars({
        [headingSize4FontSize]: `${font.heading.sizes[4].fontSize}px`,
        [headingSize4LineHeight]: `${font.heading.sizes[4].lineHeight}px`,
        [headingSize3FontSize]: `${font.heading.sizes[3].fontSize}px`,
        [headingSize3LineHeight]: `${font.heading.sizes[3].lineHeight}px`,
        [headingSize2FontSize]: `${font.heading.sizes[2].fontSize}px`,
        [headingSize2LineHeight]: `${font.heading.sizes[2].lineHeight}px`,
      })}
    >
      {!isSingleton && (
        <Inline space={1}>
          <Text muted size={1}>
            {schemaType.title ?? schemaType.name}
          </Text>
          {description && (
            <Tooltip content={description} placement="right">
              <InfoOutlineIcon data-testid="schema-description-icon" />
            </Tooltip>
          )}
        </Inline>
      )}
      <Heading as="h2" data-heading muted={!title} data-testid="document-panel-document-title">
        {title ?? t('document-view.form-view.form-title-fallback')}
      </Heading>
    </Stack>
  )
}

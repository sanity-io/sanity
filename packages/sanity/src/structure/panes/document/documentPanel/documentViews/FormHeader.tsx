import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {type ObjectSchemaType} from '@sanity/types'
import {Heading, Inline, Stack, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useTranslation} from 'sanity'

import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {structureLocaleNamespace} from '../../../../i18n'
import {
  headingSize2FontSizeVar,
  headingSize2LineHeightVar,
  headingSize3FontSizeVar,
  headingSize3LineHeightVar,
  headingSize4FontSizeVar,
  headingSize4LineHeightVar,
  titleContainer,
} from './FormHeader.css'

interface DocumentHeaderProps {
  documentId: string
  schemaType: ObjectSchemaType
  title?: string
}

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

  const headingSizes = font.heading.sizes

  return (
    <Stack
      className={titleContainer}
      style={assignInlineVars({
        [headingSize4FontSizeVar]: `${headingSizes[4].fontSize}px`,
        [headingSize4LineHeightVar]: `${headingSizes[4].lineHeight}px`,
        [headingSize3FontSizeVar]: `${headingSizes[3].fontSize}px`,
        [headingSize3LineHeightVar]: `${headingSizes[3].lineHeight}px`,
        [headingSize2FontSizeVar]: `${headingSizes[2].fontSize}px`,
        [headingSize2LineHeightVar]: `${headingSizes[2].lineHeight}px`,
      })}
      marginBottom={6}
      gap={4}
    >
      {!isSingleton && (
        <Inline gap={1}>
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

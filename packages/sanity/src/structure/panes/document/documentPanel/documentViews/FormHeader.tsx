import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {type ObjectSchemaType} from '@sanity/types'
import {Heading, Inline, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type CSSProperties, type MouseEvent} from 'react'
import {useTranslation} from 'sanity'
import {Text, Box, Flex, PressArea} from 'ui5'

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
  /**
   * When given, the title is a button that calls this. Left out when no
   * single field sets the title or the form is read-only.
   */
  onTitleClick?: () => void
}

// Leave focus where it is until the title field mounts and takes it.
const preventDefault = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault()

/**
 * Header containing current document title and type.
 * Document type is hidden if the document `_id` matches the current document `_type`.
 * The entire header is hidden if container queries are not supported.
 */
export const FormHeader = ({documentId, schemaType, title, onTitleClick}: DocumentHeaderProps) => {
  const isSingleton = documentId === schemaType.name
  const description = schemaType.description
  const {t} = useTranslation(structureLocaleNamespace)
  const {font} = useThemeV2()

  if (schemaType.__experimental_formPreviewTitle === false) {
    return null
  }

  const headingSizes = font.heading.sizes
  const titleText = title ?? t('document-view.form-view.form-title-fallback')

  return (
    <Flex
      className={titleContainer}
      style={
        {
          [headingSize4FontSizeVar]: `${headingSizes[4].fontSize}px`,
          [headingSize4LineHeightVar]: `${headingSizes[4].lineHeight}px`,
          [headingSize3FontSizeVar]: `${headingSizes[3].fontSize}px`,
          [headingSize3LineHeightVar]: `${headingSizes[3].lineHeight}px`,
          [headingSize2FontSizeVar]: `${headingSizes[2].fontSize}px`,
          [headingSize2LineHeightVar]: `${headingSizes[2].lineHeight}px`,
        } as CSSProperties
      }
      flexDirection="column"
      marginBottom={6}
      gap={4}
    >
      {!isSingleton && (
        <Inline gap={1}>
          <Text muted size={1} as="div" trim={true}>
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
        {onTitleClick ? (
          // The heading wraps the button rather than sitting inside it: a button's children are
          // presentational, so a heading inside one loses its role. The text keeps the heading's
          // container-query sizes, which a v5 Text would override.
          <Box as="span" width="fit-content">
            <PressArea
              data-testid="document-panel-document-title-field"
              onClick={onTitleClick}
              onMouseDown={preventDefault}
              type="button"
            >
              {titleText}
            </PressArea>
          </Box>
        ) : (
          titleText
        )}
      </Heading>
    </Flex>
  )
}

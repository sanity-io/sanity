import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {type ObjectSchemaType} from '@sanity/types'
import {Heading, Inline, Text} from '@sanity/ui'
import {type MouseEvent} from 'react'
import {useTranslation} from 'sanity'
import {css, styled} from 'styled-components'
import {Box, PressArea, VStack} from 'ui5'

import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {structureLocaleNamespace} from '../../../../i18n'

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
 * Use CSS container queries to conditionally render headings at different sizes.
 * We hide this entire container (including the document type) if container queries
 * not supported in the current browser.
 *
 * Note that usage of container queries in `styled-components` is only supported in `6.x`.
 * As such, studios that include `"styled-components": "<6"` as a dependency will only see
 * the largest heading size here, even if their browser supports it!
 */

const TitleContainer = styled(VStack)`
  ${({theme}) => {
    return css`
      @supports not (container-type: inline-size) {
        display: none !important;
      }

      container-type: inline-size;

      [data-heading] {
        font-size: ${theme.sanity.fonts.heading.sizes[4].fontSize /* oxlint-disable-line no-deprecated -- will fix in follow up PR */}px;
        line-height: ${theme.sanity.fonts.heading.sizes[4].lineHeight /* oxlint-disable-line no-deprecated -- will fix in follow up PR */}px;
        overflow-wrap: break-word;
        text-wrap: pretty;
      }

      @container (max-width: 560px) {
        [data-heading] {
          font-size: ${theme.sanity.fonts.heading.sizes[3].fontSize /* oxlint-disable-line no-deprecated -- will fix in follow up PR */}px;
          line-height: ${theme.sanity.fonts.heading.sizes[3].lineHeight /* oxlint-disable-line no-deprecated -- will fix in follow up PR */}px;
        }
      }

      @container (max-width: 420px) {
        [data-heading] {
          font-size: ${theme.sanity.fonts.heading.sizes[2].fontSize /* oxlint-disable-line no-deprecated -- will fix in follow up PR */}px;
          line-height: ${theme.sanity.fonts.heading.sizes[2].lineHeight /* oxlint-disable-line no-deprecated -- will fix in follow up PR */}px;
        }
      }
    `
  }}
`

/**
 * Header containing current document title and type.
 * Document type is hidden if the document `_id` matches the current document `_type`.
 * The entire header is hidden if container queries are not supported.
 */
export const FormHeader = ({documentId, schemaType, title, onTitleClick}: DocumentHeaderProps) => {
  const isSingleton = documentId === schemaType.name
  const description = schemaType.description
  const {t} = useTranslation(structureLocaleNamespace)

  if (schemaType.__experimental_formPreviewTitle === false) {
    return null
  }

  const titleText = title ?? t('document-view.form-view.form-title-fallback')

  return (
    <TitleContainer marginBottom={6} gap={4}>
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
    </TitleContainer>
  )
}

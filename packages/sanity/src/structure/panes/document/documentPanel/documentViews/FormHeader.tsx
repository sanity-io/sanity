import {InfoOutlineIcon} from '@sanity/icons'
import {type ObjectSchemaType} from '@sanity/types'
import {Heading, Inline, Stack, Text} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {useTranslation} from 'sanity'
import {css, styled} from 'styled-components'

import {Tooltip} from '../../../../../ui-components'
import {structureLocaleNamespace} from '../../../../i18n'

interface DocumentHeaderProps {
  documentId: string
  schemaType: ObjectSchemaType
  title?: string
}

/**
 * Use CSS container queries to conditionally render headings at different scale.
 * We hide this entire container (including the document type) if container queries
 * not supported in the current browser.
 *
 * Note that usage of container queries in `styled-components` is only supported in `6.x`.
 * As such, studios that include `"styled-components": "<6"` as a dependency will only see
 * the largest heading size here, even if their browser supports it!
 */

export const TitleContainer = styled(Stack)`
  ${({theme}) => {
    return css`
      @supports not (container-type: inline-size) {
        display: none !important;
      }

      container-type: inline-size;

      [data-heading] {
        font-size: ${vars.font.heading.scale[4].fontSize};
        line-height: ${vars.font.heading.scale[4].lineHeight};
        overflow-wrap: break-word;
        text-wrap: pretty;
      }

      @container (max-width: 560px) {
        [data-heading] {
          font-size: ${vars.font.heading.scale[3].fontSize};
          line-height: ${vars.font.heading.scale[3].lineHeight};
        }
      }

      @container (max-width: 420px) {
        [data-heading] {
          font-size: ${vars.font.heading.scale[2].fontSize};
          line-height: ${vars.font.heading.scale[2].lineHeight};
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
export const FormHeader = ({documentId, schemaType, title}: DocumentHeaderProps) => {
  const isSingleton = documentId === schemaType.name
  const description = schemaType.description
  const {t} = useTranslation(structureLocaleNamespace)

  if (schemaType.__experimental_formPreviewTitle === false) {
    return null
  }
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
        {title ?? t('document-view.form-view.form-title-fallback')}
      </Heading>
    </TitleContainer>
  )
}

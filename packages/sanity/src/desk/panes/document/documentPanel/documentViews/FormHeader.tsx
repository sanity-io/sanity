import {SchemaType} from '@sanity/types'
import {Heading, Stack, Text} from '@sanity/ui'
import styled, {css} from 'styled-components'

interface DocumentHeaderProps {
  documentId: string
  schemaType: SchemaType
  title?: string
}

// Use CSS container queries to conditionally render headings at different sizes.
// Hide if container queries are not supported.
export const TitleContainer = styled(Stack)`
  ${({theme}) => {
    return css`
      @supports not (container-type: inline-size) {
        display: none !important;
      }

      container-type: inline-size;

      [data-heading] {
        font-size: ${theme.sanity.fonts.heading.sizes[2].fontSize}px;
        line-height: ${theme.sanity.fonts.heading.sizes[2].lineHeight}px;
        overflow-wrap: break-word;
      }

      @container (min-width: 420px) {
        [data-heading] {
          font-size: ${theme.sanity.fonts.heading.sizes[3].fontSize}px;
          line-height: ${theme.sanity.fonts.heading.sizes[3].lineHeight}px;
        }
      }

      @container (min-width: 560px) {
        [data-heading] {
          font-size: ${theme.sanity.fonts.heading.sizes[4].fontSize}px;
          line-height: ${theme.sanity.fonts.heading.sizes[4].lineHeight}px;
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

  return (
    <TitleContainer marginBottom={6} space={4}>
      {!isSingleton && (
        <Text muted size={1}>
          {schemaType.title ?? schemaType.name}
        </Text>
      )}

      <Heading as="h2" data-heading muted={!title}>
        {title ?? 'Untitled'}
      </Heading>
    </TitleContainer>
  )
}
import {rem} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type ReactNode, useContext} from 'react'
import {type ObjectSchemaType, type PublishedId} from 'sanity'
import {PresentationDocumentContext} from 'sanity/_singletons'
import {css, styled} from 'styled-components'

import {type PresentationPluginOptions} from '../types'
import {LocationsBanner} from './LocationsBanner'

const LocationStack = styled.div((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    display: flex;
    flex-direction: column;
    gap: ${rem(theme.space[2])};
    min-height: ${rem(42)};
    margin-bottom: ${rem(theme.space[5])};

    &:empty {
      display: none;
    }
  `
})

export function PresentationDocumentHeader(props: {
  documentId: PublishedId
  version: string | undefined
  options: PresentationPluginOptions
  schemaType: ObjectSchemaType
}): ReactNode {
  const {documentId, options, schemaType, version} = props
  const context = useContext(PresentationDocumentContext)

  const contextOptions = context?.options || []
  const resolvers = contextOptions.map((o) => o.resolve?.locations || o.locate)
  const hasResolvers = resolvers.some(Boolean)

  if ((context && context.options[0] !== options) || !hasResolvers) {
    return null
  }

  return (
    <LocationStack>
      {contextOptions.map((_options, idx) => (
        <LocationsBanner
          // oxlint-disable-next-line no-array-index-key
          key={idx}
          documentId={documentId}
          options={_options}
          resolvers={resolvers[idx]}
          schemaType={schemaType}
          showPresentationTitle={contextOptions.length > 1}
          version={version}
        />
      ))}
    </LocationStack>
  )
}

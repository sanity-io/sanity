import {vars} from '@sanity/ui/css'
import {type ReactNode, useContext} from 'react'
import {type ObjectSchemaType, type PublishedId} from 'sanity'
import {PresentationDocumentContext} from 'sanity/_singletons'
import {css, styled} from 'styled-components'

import {type PresentationPluginOptions} from '../types'
import {LocationsBanner} from './LocationsBanner'

const LocationStack = styled.div((props) => {
  return css`
    display: flex;
    flex-direction: column;
    gap: ${vars.space[2]};
    min-height: ${42 / 16}rem;
    margin-bottom: ${vars.space[5]};

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

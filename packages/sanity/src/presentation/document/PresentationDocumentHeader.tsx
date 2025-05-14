import {rem, Stack} from '@sanity/ui'
import {type ReactNode, useContext} from 'react'
import {type ObjectSchemaType, type PublishedId} from 'sanity'
import {PresentationDocumentContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {type PresentationPluginOptions} from '../types'
import {LocationsBanner} from './LocationsBanner'

const LocationStack = styled(Stack)`
  min-height: ${rem(42)};

  & + &:empty {
    display: none;
  }
`

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
    <LocationStack marginBottom={5} space={5}>
      <Stack space={2}>
        {contextOptions.map((_options, idx) => (
          <LocationsBanner
            key={idx}
            documentId={documentId}
            options={_options}
            resolvers={resolvers[idx]}
            schemaType={schemaType}
            showPresentationTitle={contextOptions.length > 1}
            version={version}
          />
        ))}
      </Stack>
    </LocationStack>
  )
}

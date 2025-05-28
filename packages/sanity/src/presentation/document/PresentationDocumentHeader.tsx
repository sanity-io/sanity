import {rem, Stack} from '@sanity/ui'
import {type ReactNode, useContext} from 'react'
import {type ObjectSchemaType, type PublishedId} from 'sanity'
import {PresentationDocumentContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {type PresentationPluginOptions} from '../types'
import {useDocumentLocations} from '../useDocumentLocations'
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
  const {state, status} = useDocumentLocations({
    id: documentId,
    version,
    resolvers: options.resolve?.locations || options.locate,
    type: schemaType.name,
  })

  if ((context && context.options[0] !== options) || status === 'empty') {
    return null
  }

  const contextOptions = context?.options || []

  return (
    <LocationStack marginBottom={5} space={5}>
      <Stack space={2}>
        {contextOptions.map(
          (
            // eslint-disable-next-line @typescript-eslint/no-shadow
            options,
            idx,
          ) => (
            <LocationsBanner
              documentId={documentId}
              isResolving={status === 'resolving'}
              key={idx}
              options={options}
              schemaType={schemaType}
              showPresentationTitle={contextOptions.length > 1}
              state={state}
            />
          ),
        )}
      </Stack>
    </LocationStack>
  )
}

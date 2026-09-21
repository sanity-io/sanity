import {rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ReactNode, useContext} from 'react'
import {FormRow, type ObjectSchemaType, type PublishedId} from 'sanity'
import {PresentationDocumentContext} from 'sanity/_singletons'

import {type PresentationPluginOptions} from '../types'
import {LocationsBanner} from './LocationsBanner'
import {locationStack, space2Var, space5Var} from './PresentationDocumentHeader.css'

export function PresentationDocumentHeader(props: {
  documentId: PublishedId
  version: string | undefined
  options: PresentationPluginOptions
  schemaType: ObjectSchemaType
}): ReactNode {
  const {documentId, options, schemaType, version} = props
  const context = useContext(PresentationDocumentContext)
  const {space} = useThemeV2()

  const contextOptions = context?.options || []
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const resolvers = contextOptions.map((o) => o.resolve?.locations || o.locate)
  const hasResolvers = resolvers.some(Boolean)

  if ((context && context.options[0] !== options) || !hasResolvers) {
    return null
  }

  return (
    <FormRow>
      <div
        className={locationStack}
        style={assignInlineVars({
          [space2Var]: `${rem(space[2])}`,
          [space5Var]: `${rem(space[5])}`,
        })}
      >
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
      </div>
    </FormRow>
  )
}

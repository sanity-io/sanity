import React, {useCallback} from 'react'
import {Card, Text, Flex} from '@sanity/ui'
import {Asset as AssetType, SanityDocument} from '@sanity/types'
import {SanityPreview} from '../../../preview'
import {IntentLink} from '../../../router'
import {useSchema} from '../../../hooks'

export const DocumentList = ({
  asset,
  assetType,
  referringDocuments,
}: {
  asset: AssetType
  assetType: 'image' | 'file'
  referringDocuments: SanityDocument[]
}) => {
  const count = referringDocuments.length
  const hasResults = count > 0
  const filenamePlaceholder = asset.originalFilename ? (
    <strong>{asset.originalFilename}</strong>
  ) : (
    `this ${assetType}`
  )

  if (!hasResults) {
    return (
      <Text size={[1, 1, 2, 2]} as="h2" weight="regular">
        No documents are using {filenamePlaceholder}
      </Text>
    )
  }

  return (
    <>
      <Card borderBottom marginTop={2} paddingBottom={2} marginBottom={1}>
        <Text as="h2" size={[1, 1, 2, 2]} weight="regular" textOverflow="ellipsis">
          {count} {count === 1 ? `document is` : `documents are`} using {filenamePlaceholder}
        </Text>
      </Card>
      {referringDocuments.map((document: SanityDocument) => (
        <DocumentLink key={document._id} document={document} />
      ))}
    </>
  )
}

const DocumentLink = ({document}: {document: SanityDocument}) => {
  const schema = useSchema()

  const LinkComponent = useCallback(
    (linkProps: Omit<React.HTMLProps<HTMLAnchorElement>, 'ref'>) => (
      <IntentLink {...linkProps} params={{id: document._id, type: document._type}} intent="edit" />
    ),

    [document]
  )

  return (
    <Card
      as={LinkComponent}
      paddingY={2}
      paddingX={1}
      radius={2}
      key={document._id}
      data-as="a"
      tabIndex={0}
    >
      <Flex align="center" gap={2}>
        <SanityPreview
          layout="default"
          value={{_type: 'reference', _ref: document._id}}
          schemaType={schema.get(document._type)!}
        />
      </Flex>
    </Card>
  )
}

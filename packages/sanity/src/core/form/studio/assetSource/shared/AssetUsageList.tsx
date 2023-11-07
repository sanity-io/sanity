import React, {useCallback} from 'react'
import {Card, Flex, Text} from '@sanity/ui'
import {Asset as AssetType, SanityDocument} from '@sanity/types'
import {useSchema} from '../../../../hooks'
import {Preview} from '../../../../preview/components/Preview'
import {Translate, useTranslation} from '../../../../i18n'
import {IntentLink} from 'sanity/router'

export const AssetUsageList = ({
  asset,
  assetType,
  referringDocuments,
}: {
  asset: AssetType
  assetType: 'image' | 'file'
  referringDocuments: SanityDocument[]
}) => {
  const {t} = useTranslation()
  const count = referringDocuments.length
  return (
    <>
      <Card borderBottom marginTop={2} paddingBottom={2} marginBottom={1}>
        <Text size={[1, 1, 2, 2]} as="h2" weight="regular">
          <Translate
            t={t}
            i18nKey={`asset-source.usage-list.documents-using-${assetType}`}
            context={asset.originalFilename ? 'named' : 'unnamed'}
            values={{filename: asset.originalFilename, count}}
          />
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

    [document],
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
        <Preview
          layout="default"
          value={{_type: 'reference', _ref: document._id}}
          schemaType={schema.get(document._type)!}
        />
      </Flex>
    </Card>
  )
}

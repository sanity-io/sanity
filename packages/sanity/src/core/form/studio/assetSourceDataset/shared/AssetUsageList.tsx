import {type Asset as AssetType, type SanityDocument} from '@sanity/types'
import {Card, Flex, Text} from '@sanity/ui'
import {type HTMLProps, useCallback} from 'react'
import {IntentLink} from 'sanity/router'

import {useSchema} from '../../../../hooks'
import {Translate, useTranslation} from '../../../../i18n'
import {Preview} from '../../../../preview/components/Preview'

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
      <Card borderBottom={count > 0} marginTop={2} paddingBottom={2} marginBottom={1}>
        <Text size={1} as="h2" weight="medium">
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
    (linkProps: Omit<HTMLProps<HTMLAnchorElement>, 'ref'>) => (
      <IntentLink {...linkProps} params={{id: document._id, type: document._type}} intent="edit" />
    ),

    [document],
  )

  return (
    <Card key={document._id} as={LinkComponent} radius={2} data-as="a" tabIndex={0}>
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

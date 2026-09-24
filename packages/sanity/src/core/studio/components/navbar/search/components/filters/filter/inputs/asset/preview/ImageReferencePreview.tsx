import {type ImageAsset, type ReferenceValue} from '@sanity/types'
import {Card} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, useCallback, useState} from 'react'

import {LoadingBlock} from '../../../../../../../../../../components/loadingBlock/LoadingBlock'
import {observeImageAsset} from '../../../../../../../../../../form/studio/inputs/client-adapters/assets'
import {WithReferencedAsset} from '../../../../../../../../../../form/utils/WithReferencedAsset'
import {useDocumentPreviewStore} from '../../../../../../../../../../store/datastores'
import {container, image} from './ImageReferencePreview.css'

interface ImageReferencePreviewProps {
  reference: ReferenceValue
}

function Image(props: ComponentProps<'img'>) {
  const {className, ...rest} = props
  return <img {...rest} className={clsx(image, className)} />
}

export function ImageReferencePreview({reference}: ImageReferencePreviewProps) {
  const documentPreviewStore = useDocumentPreviewStore()
  const observeAsset = useCallback(
    (id: string) => observeImageAsset(documentPreviewStore, id),
    [documentPreviewStore],
  )
  return (
    <WithReferencedAsset observeAsset={observeAsset} reference={reference}>
      {(asset) => <ImagePreview asset={asset} />}
    </WithReferencedAsset>
  )
}

function ImagePreview({asset}: {asset: ImageAsset}) {
  const [loaded, setLoaded] = useState(false)
  const imageUrl = `${asset.url}?h=800&fit=max`
  const handleLoad = useCallback(() => setLoaded(true), [])

  return (
    <Card __unstable_checkered border className={container}>
      {!loaded && <LoadingBlock fill showText />}
      <Image onLoad={handleLoad} src={imageUrl} />
    </Card>
  )
}

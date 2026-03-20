import {type ImageAsset, type ReferenceValue} from '@sanity/types'
import {Card} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {LoadingBlock} from '../../../../../../../../../../components/loadingBlock'
import {observeImageAsset} from '../../../../../../../../../../form/studio/inputs/client-adapters/assets'
import {WithReferencedAsset} from '../../../../../../../../../../form/utils/WithReferencedAsset'
import {useDocumentPreviewStore} from '../../../../../../../../../../store'

import {container, image as imageClass} from './ImageReferencePreview.css'

interface ImageReferencePreviewProps {
  reference: ReferenceValue
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
    <Card className={container} __unstable_checkered border>
      {!loaded && <LoadingBlock fill showText />}
      <img className={imageClass} onLoad={handleLoad} src={imageUrl} />
    </Card>
  )
}

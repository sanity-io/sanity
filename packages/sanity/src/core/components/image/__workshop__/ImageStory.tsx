import React, {useMemo} from 'react'
import {Image, ImageSource} from '../Image'

export default function ImageStory() {
  const assetId = 'image-7a450942c7845e53e1daddaffc2999f719352e16-3024x4032-jpg'

  const source: ImageSource = useMemo(
    () => ({
      _type: 'image',
      asset: {_ref: assetId, _type: 'reference'},
      crop: {
        _type: 'sanity.imageCrop',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0.0032679738562091387,
      },
      hotspot: {
        _type: 'sanity.imageHotspot',
        x: 0.5144927536231892,
        y: 0.5854493971501638,
        height: 0.5496285470710024,
        width: 0.6557057605650974,
      },
    }),
    [assetId],
  )

  return (
    <Image dpr={2} fit="crop" source={source} style={{width: '100%'}} width={600} height={900} />
  )
}

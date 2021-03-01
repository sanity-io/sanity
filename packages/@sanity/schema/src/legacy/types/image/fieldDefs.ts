export const ASSET_FIELD = {
  name: 'asset',
  type: 'reference',
  to: [{type: 'sanity.imageAsset'}],
}

export const HOTSPOT_FIELD = {
  name: 'hotspot',
  type: 'sanity.imageHotspot',
}

export const CROP_FIELD = {
  name: 'crop',
  type: 'sanity.imageCrop',
}

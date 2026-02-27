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

export const MEDIA_LIBRARY_ASSET_FIELD = {
  name: 'media',
  type: 'globalDocumentReference',
  hidden: true,
  to: [{type: 'sanity.asset'}],
}


export const ASSET_FIELD = {
  name: 'asset',
  type: 'reference',
  to: [{type: 'imageAsset'}]
}

export const HOTSPOT_FIELD = {
  name: 'hotspot',
  type: 'object',
  fields: [
    {
      name: 'x',
      type: 'number'
    },
    {
      name: 'y',
      type: 'number'
    },
    {
      name: 'height',
      type: 'number'
    },
    {
      name: 'width',
      type: 'number'
    }
  ]
}

export const CROP_FIELD = {
  name: 'crop',
  type: 'object',
  fields: [
    {
      name: 'top',
      type: 'number'
    },
    {
      name: 'bottom',
      type: 'number'
    },
    {
      name: 'left',
      type: 'number'
    },
    {
      name: 'right',
      type: 'number'
    }
  ]
}

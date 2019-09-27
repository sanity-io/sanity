import {boolean, shape, string} from 'prop-types'

export const assetType = shape({
  _id: string.isRequired
})

export const itemType = shape({
  asset: assetType,
  updating: boolean
})

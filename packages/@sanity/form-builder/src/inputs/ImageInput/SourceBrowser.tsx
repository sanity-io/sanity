import React from 'react'
import styles from './styles/SelectAsset.css'
import AssetSources from 'all:part:@sanity/form-builder/input/asset-source'

type Asset = {
  _id: string
  url: string
}
type Props = {
  onSelect: (arg0: Asset) => void,
}

type State = {
  assets: Array<Asset>
  isLastPage: boolean
  isLoading: boolean
}

export default class SelectAsset extends React.Component<Props, State> {
  handleOnSelect = event => {
    this.props.onSelect(event)
  }
  renderSources() {
    return (
      AssetSources.map(source => {
        const SelectAsset = source.component
        return (
          <li>
            <SelectAsset onSelect={this.handleOnSelect} />
          </li>
        )
      })
    )
  }
  render() {
    if (!AssetSources) {
      // TODO: return error
      return null
    }
    const SelectAsset = AssetSources[0].component
    return (
      <div className={styles.root}>
          {AssetSources.length > 1 && this.renderSources()}
          {AssetSources.length === 1 && (
            <SelectAsset onSelect={this.handleOnSelect}/>
          )}
      </div>
    )
  }
}

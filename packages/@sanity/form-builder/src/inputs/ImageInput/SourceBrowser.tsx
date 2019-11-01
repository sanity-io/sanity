import React from 'react'
import {get} from 'lodash'
// TODO: investigate why 'all:part' doesn't work with TS, when just 'part:' works.
// @ts-ignore
import assetSources from 'all:part:@sanity/form-builder/input/asset-source'
import userDefinedAssetSources from 'part:@sanity/form-builder/input/asset-sources?'
import Snackbar from 'part:@sanity/components/snackbar/default'
import styles from './styles/SelectAsset.css'
import {Type} from '../../typedefs'

type AssetFromSource = {
  kind: 'assetDocumentId' | 'binary'
  value: string
}

type Props = {
  onSelect: (arg0: AssetFromSource) => void
  type: Type
}

const globalSources = userDefinedAssetSources ? userDefinedAssetSources : assetSources

export default class SelectAsset extends React.Component<Props> {
  sources = globalSources

  constructor(props: Props) {
    super(props)
    // Allow overriding sources set directly on type.options
    const sourcesFromType = get(props.type, 'options.sources')
    if (Array.isArray(sourcesFromType) && sourcesFromType.length > 0) {
      this.sources = sourcesFromType
    } else if (sourcesFromType) {
      this.sources = null
    }
  }

  handleOnSelect = value => {
    this.props.onSelect(value)
  }
  renderSources() {
    const sources = this.sources.map(source => {
      const SelectAsset = source.component
      return (
        <li key={source.name}>
          <h3>{source.title}</h3>
          <SelectAsset onSelect={this.handleOnSelect} />
        </li>
      )
    })
    return <ul>{sources}</ul>
  }
  render() {
    if (!this.sources) {
      return (
        <Snackbar
          kind="error"
          isPersisted
          title={'No asset sources were returned with the current configuration.'}
        >
          <p>
            Please check your image type options (sources) or your parts implementation for asset
            sources.
          </p>
        </Snackbar>
      )
    }
    const SelectAsset = this.sources[0].component
    return (
      <div className={styles.root}>
        {this.sources.length > 1 && this.renderSources()}
        {this.sources.length === 1 && <SelectAsset onSelect={this.handleOnSelect} />}
      </div>
    )
  }
}

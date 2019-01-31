// @flow
import React from 'react'
import client from 'part:@sanity/base/client'
import Button from 'part:@sanity/components/buttons/default'
import styles from './styles/SelectAsset.css'
import ImageAsset from './Asset'

const PER_PAGE = 200

type Asset = {
  _id: string,
  url: string
}
type State = {
  assets: Array<Asset>,
  isLastPage: boolean
}
type Props = {
  onSelect: Asset => void
}

function createQuery(start = 0, end = PER_PAGE) {
  return `
    *[_type == "sanity.imageAsset"] | order(_updatedAt desc) [${start}...${end}] {
      _id,
      url,
      metadata {dimensions}
    }
  `
}

export default class SelectAsset extends React.Component<Props, State> {
  state = {
    assets: [],
    isLastPage: false,
    isLoading: false
  }

  pageNo: number
  pageNo = 0

  fetchPage(pageNo: number) {
    const start = pageNo * PER_PAGE
    const end = start + PER_PAGE
    this.setState({isLoading: true})
    return client.fetch(createQuery(start, end)).then(result => {
      this.setState(prevState => ({
        isLastPage: result.length === 0,
        assets: prevState.assets.concat(result),
        isLoading: false
      }))
    })
  }

  handleUpdate = () => {
    this.fetchPage(this.pageNo)
  }

  componentDidMount() {
    this.fetchPage(this.pageNo)
  }

  select(id) {
    const selected = this.state.assets.find(doc => doc._id === id)
    if (selected) {
      this.props.onSelect(selected)
    }
  }

  handleItemClick = (event: SyntheticEvent<*>) => {
    event.preventDefault()
    this.select(event.currentTarget.getAttribute('data-id'))
  }

  handleItemKeyPress = (event: SyntheticEvent<*>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.select(event.currentTarget.getAttribute('data-id'))
    }
  }
  handleFetchNextPage = () => {
    this.fetchPage(++this.pageNo)
  }

  render() {
    const {assets, isLastPage, isLoading} = this.state
    return (
      <div className={styles.root}>
        <div className={styles.imageList}>
          {assets.map(asset => (
            <ImageAsset
              key={asset._id}
              asset={asset}
              onClick={this.handleItemClick}
              onKeyPress={this.handleItemKeyPress}
              onDeleteFinished={this.handleUpdate}
            />
          ))}
        </div>
        <div className={styles.loadMore}>
          {!isLastPage && (
            <Button onClick={this.handleFetchNextPage} loading={isLoading}>
              Load more
            </Button>
          )}
        </div>
      </div>
    )
  }
}

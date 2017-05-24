import React, {PropTypes} from 'react'
import DefaultPreview from 'part:@sanity/components/previews/default'
import previewStyles from './AuthorPreview.css'

const staleThreshold = 3 * 24 * 60 * 60 * 1000 // 3 days

const AuthorPreview = props => {
  if (!props.value) {
    return <DefaultPreview {...props} item={props.value} />
  }

  const lastUpdated = new Date(props.value.lastUpdated)
  const diff = (new Date()) - lastUpdated
  const isStale = diff > staleThreshold
  const styles = isStale ? {root: previewStyles.staleAuthor} : undefined

  // Note: item=value is only temporary, fix is pending
  return (
    <DefaultPreview
      {...props}
      styles={styles}
      item={props.value}
    />
  )
}

AuthorPreview.defaultProps = {
  value: null
}

AuthorPreview.propTypes = {
  value: PropTypes.shape({
    lastUpdated: PropTypes.string
  })
}

export default AuthorPreview

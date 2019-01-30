import React from 'react'
import PropTypes from 'prop-types'
import {WithReferringDocuments} from 'part:@sanity/base/with-referring-documents'

export default function enhanceWithReferringDocuments(Component) {
  function EnhancedWithReferringDocuments(props) {
    // eslint-disable-next-line react/no-multi-comp
    const renderChild = ({isLoading, referringDocuments}) => (
      <Component
        {...props}
        referringDocuments={referringDocuments}
        isCheckingReferringDocuments={isLoading}
      />
    )
    return props.published ? (
      <WithReferringDocuments id={props.published._id}>{renderChild}</WithReferringDocuments>
    ) : (
      renderChild({referringDocuments: [], isLoading: false})
    )
  }

  EnhancedWithReferringDocuments.displayName = `enhanceWithReferringDocuments(${Component.displayName ||
    Component.name})`
  EnhancedWithReferringDocuments.propTypes = {
    published: PropTypes.object
  }
  return EnhancedWithReferringDocuments
}

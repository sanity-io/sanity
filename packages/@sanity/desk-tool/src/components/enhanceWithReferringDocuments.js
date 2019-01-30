import React from 'react'
import PropTypes from 'prop-types'
import {WithReferringDocuments} from 'part:@sanity/base/with-referring-documents'

export default function enhanceWithReferringDocuments(Component) {
  function EnhancedWithReferringDocuments(props) {
    return (
      <WithReferringDocuments id={props.id}>
        {({isLoading, referringDocuments}) => (
          <Component
            {...props}
            referringDocuments={referringDocuments}
            isCheckingReferringDocuments={isLoading}
          />
        )}
      </WithReferringDocuments>
    )
  }

  EnhancedWithReferringDocuments.displayName = `enhanceWithReferringDocuments(${Component.displayName ||
    Component.name})`
  EnhancedWithReferringDocuments.propTypes = {
    published: PropTypes.object
  }
  return EnhancedWithReferringDocuments
}

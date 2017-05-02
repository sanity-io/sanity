import React from 'react'
import PropTypes from 'prop-types'
import dataAspects from '../utils/dataAspects'

export default function DocTitle(props) {
  const {document} = props
  const titleProp = dataAspects.getItemDisplayField(document._type)
  return <span>{document[titleProp] || 'Untitled…'}</span>
}

DocTitle.propTypes = {
  document: PropTypes.shape({
    _type: PropTypes.string,
  })
}

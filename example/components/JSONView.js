import React, {PropTypes} from 'react'

import jsonMarkup from 'json-markup'

export default function JSONView(props) {
  return (
    <pre>
      <code dangerouslySetInnerHTML={{__html: jsonMarkup(props.json)}} />
    </pre>
  )
}

JSONView.propTypes = {
  json: PropTypes.object
}

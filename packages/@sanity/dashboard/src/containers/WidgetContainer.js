import PropTypes from 'prop-types'
import React from 'react'
import definitions from 'all:part:@sanity/dashboard/widget?'
import NotFoundWidget from '../components/NotFoundWidget'

function WidgetContainer(props) {
  const config = props.config || {}
  const definition = Array.isArray(definitions)
    ? definitions.find(wid => wid.name === config.name)
    : null

  if (definition) {
    const options = {
      ...(definition.options || {}),
      ...(config.options || {})
    }
    const layout = {
      ...(definition.layout || {}),
      ...(config.layout || {})
    }

    return (
      <div data-width={layout.width} data-height={layout.height}>
        {React.createElement(definition.component, options)}
      </div>
    )
  }

  const layout = config.layout || {}

  return (
    <div data-width={layout.width} data-height={layout.height}>
      <NotFoundWidget title={<>Not found: "{config.name}"</>}>
        <p>
          Make sure your <code>sanity.json</code> file mentions such a widget and that it’s an
          implementation of <code>part:@sanity/dashboard/widget</code>.
        </p>
      </NotFoundWidget>
    </div>
  )
}

WidgetContainer.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  config: PropTypes.any
}

WidgetContainer.defaultProps = {
  config: null
}

export default WidgetContainer

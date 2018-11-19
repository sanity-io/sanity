/* eslint-disable react/prop-types, react/no-multi-comp */
import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import ReactJson from 'react-json-view'

function isJSONValue(data) {
  return data !== null && typeof data === 'object'
}

class JsonBlock extends React.PureComponent {
  render() {
    const {data} = this.props
    const styles = this.context.styles.jsonDump

    return (
      <pre className={styles.block}>
        {isJSONValue(data) ? (
          <ReactJson displayDataTypes={false} src={data} name={null} />
        ) : (
          <span className={styles.primitive}>{data || 'null'}</span>
        )}
      </pre>
    )
  }
}

JsonBlock.contextTypes = {
  styles: PropTypes.object
}

export default function JsonDump(props) {
  if (!Array.isArray(props.data)) {
    return <JsonBlock data={props.data} />
  }

  return (
    <Fragment>
      {props.data.map((row, i) => (
        <JsonBlock key={row._id || row.eventId || i} data={row} />
      ))}
    </Fragment>
  )
}

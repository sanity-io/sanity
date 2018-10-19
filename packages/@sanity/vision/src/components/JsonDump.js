/* eslint-disable react/prop-types, react/no-multi-comp */
import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import ReactJson from 'react-json-view'

function typeCheck(data) {
  return typeof data !== 'object' || data === null
}

class JsonBlock extends React.PureComponent {
  render() {
    const {data} = this.props
    const styles = this.context.styles.jsonDump

    return (
      <pre className={styles.block}>
        {typeCheck(data) ? (
          <span className={styles.string}>{data || 'null'}</span>
        ) : (
          <ReactJson displayDataTypes={false} src={data} />
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

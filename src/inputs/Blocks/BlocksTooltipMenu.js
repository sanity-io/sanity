import React, {PropTypes} from 'react'
import BlocksTooltipMenuItem from './BlocksTooltipMenuItem'
import {map} from 'lodash'

export default class extends React.Component {
  static propTypes = {
    items: PropTypes.array,
    position: PropTypes.object,
  };

  render() {
    const {position} = this.props

    const style = {
      position: 'absolute',
      top: position.y,
      left: position.x,
      display: 'flex',
      background: 'black',
      borderRadius: 3,
      transform: 'translate(-50%, calc(-100% - 0.2em))',
      zIndex: 20
    }

    const items = map(this.props.items, (item, i) => {
      return (
        <BlocksTooltipMenuItem key={i} {...item} />
      )
    })

    return (
      <div style={style}>
        {items}
      </div>
    )
  }
};

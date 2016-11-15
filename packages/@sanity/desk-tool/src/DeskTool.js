import React, {PropTypes} from 'react'
import styles from './styles/DeskTool.css'
import PaneResolver from 'part:@sanity/desk-tool/pane-resolver'

export default class DeskTool extends React.Component {
  static propTypes = {
    location: PropTypes.shape({
      pathname: PropTypes.string.isRequired
    })
  };

  static contextTypes = {
    router: PropTypes.object
  };

  handleDropDownClick = action => {
    this.context.router.navigate(action.nextState)
  }

  render() {
    return (
      <div className={styles.deskTool}>
        <PaneResolver />
      </div>
    )
  }
}

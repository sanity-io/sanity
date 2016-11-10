import React, {PropTypes} from 'react'
import styles from './styles/DeskTool.css'
import PaneResolver from 'part:@sanity/desk-tool/pane-resolver'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import dataAspects from './utils/dataAspects'
import PlusIcon from 'part:@sanity/base/plus-icon'

const actions = (dataAspects.getInferredTypes()).map(type => ({
  nextState: {selectedType: type.name, action: 'create'},
  title: `${dataAspects.getDisplayName(type.name)}`
}))

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
        <div className={styles.createButtonContainer}>
          <DropDownButton
            className={styles.createButton}
            items={actions}
            kind="simple"
            onAction={this.handleDropDownClick}
            icon={PlusIcon}
          >
            Create
          </DropDownButton>
        </div>
      </div>
    )
  }
}

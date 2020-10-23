/* eslint-disable complexity */

import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import Poppable from 'part:@sanity/components/utilities/poppable'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import Button from 'part:@sanity/components/buttons/default'
import styles from './styles/SelectLanguage.css'
import ChevronDown from 'part:@sanity/base/angle-down-icon'

const LanguagePropType = PropTypes.shape({id: PropTypes.string, title: PropTypes.string})
export default class SelectLanguage extends React.Component {
  static propTypes = {
    languages: PropTypes.arrayOf(LanguagePropType),
    selected: PropTypes.arrayOf(LanguagePropType),
    onChange: PropTypes.func,
  }

  state = {isOpen: false}
  refElement = React.createRef()

  handleToggle = () => this.setState((prevState) => ({isOpen: !prevState.isOpen}))
  handleOpen = () => this.setState({isOpen: true})
  handleClose = () => {
    this.setState({isOpen: false})
  }

  selectLang = (langId) => {
    const {selected, onChange} = this.props
    onChange(selected.concat(langId))
  }

  unselectLang = (langId) => {
    const {selected, onChange} = this.props
    onChange(selected.filter((id) => id !== langId))
  }

  handleSelectAll = (event) => {
    const {languages, onChange} = this.props
    onChange(languages.map((l) => l.id))
  }
  handleSelectNone = (event) => {
    const {onChange} = this.props
    onChange([])
  }
  handleLangCheckboxChange = (event) => {
    const id = event.target.getAttribute('data-lang-id')
    const checked = event.target.checked
    this[checked ? 'selectLang' : 'unselectLang'](id)
  }

  render() {
    const {isOpen} = this.state
    const {languages, selected} = this.props
    const allIsSelected = languages.length === selected.length
    const refElement =
      this.refElement && this.refElement.current && this.refElement.current._element

    return (
      <Fragment>
        <div
          className={styles.target}
          data-open={isOpen}
          onClick={this.handleToggle}
          ref={this.refElement}
          title={
            allIsSelected
              ? 'Filter language fields'
              : 'Displaying only fields for selected languages'
          }
        >
          <div className={styles.targetValue}>
            Filter languages{allIsSelected ? '' : ` (${selected.length}/${languages.length})`}
          </div>
          <div className={styles.targetIcon}>
            <ChevronDown />
          </div>
        </div>
        <Poppable
          onEscape={this.handleClose}
          onClickOutside={this.handleClose}
          placement="bottom"
          referenceElement={refElement}
        >
          {isOpen && (
            <div className={styles.root}>
              <div className={styles.functions}>
                <Button
                  inverted
                  onClick={allIsSelected ? this.handleSelectNone : this.handleSelectAll}
                >
                  Select {allIsSelected ? 'none' : 'all'}
                </Button>
              </div>
              <ul className={styles.list}>
                {languages.map((lang) => (
                  <li className={styles.item} key={lang.id}>
                    <Checkbox
                      onChange={this.handleLangCheckboxChange}
                      data-lang-id={lang.id}
                      checked={selected.includes(lang.id)}
                    >
                      {lang.title}
                    </Checkbox>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Poppable>
      </Fragment>
    )
  }
}

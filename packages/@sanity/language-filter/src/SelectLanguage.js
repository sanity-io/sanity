/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import Poppable from 'part:@sanity/components/utilities/poppable'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import Button from 'part:@sanity/components/buttons/default'
import styles from './styles/SelectLanguage.css'
import AngleDown from 'part:@sanity/base/angle-down-icon'
import AngleUp from 'part:@sanity/base/angle-up-icon'

const LanguagePropType = PropTypes.shape({id: PropTypes.string, title: PropTypes.string})
export default class SelectLanguage extends React.Component {
  static propTypes = {
    languages: PropTypes.arrayOf(LanguagePropType),
    selected: PropTypes.arrayOf(LanguagePropType),
    onChange: PropTypes.func
  }

  state = {isOpen: false}

  handleToggle = () => this.setState(prevState => ({isOpen: !prevState.isOpen}))
  handleOpen = () => this.setState({isOpen: true})
  handleClose = () => {
    this.setState({isOpen: false})
  }

  selectLang = langId => {
    const {selected, onChange} = this.props
    onChange(selected.concat(langId))
  }

  unselectLang = langId => {
    const {selected, onChange} = this.props
    onChange(selected.filter(id => id !== langId))
  }

  handleSelectAll = event => {
    const {languages, onChange} = this.props
    onChange(languages.map(l => l.id))
  }
  handleSelectNone = event => {
    const {onChange} = this.props
    onChange([])
  }
  handleLangCheckboxChange = event => {
    const id = event.target.getAttribute('data-lang-id')
    const checked = event.target.checked
    this[checked ? 'selectLang' : 'unselectLang'](id)
  }

  render() {
    const {isOpen} = this.state
    const {languages, selected} = this.props
    const allIsSelected = languages.length === selected.length
    return (
      <Poppable
        onEscape={this.handleClose}
        onClickOutside={this.handleClose}
        target={
          <span
            className={styles.target}
            onClick={this.handleToggle}
            title={
              allIsSelected
                ? 'Filter language fields'
                : 'Displaying only fields for selected languages'
            }
          >
            Filter languages{allIsSelected ? '…' : ` (${selected.length}/${languages.length})`}
            <span className={styles.arrow}>{isOpen ? <AngleUp /> : <AngleDown />}</span>
          </span>
        }
        placement="bottom-end"
      >
        {isOpen && (
          <div className={styles.root}>
            <div className={styles.functions}>
              <Button onClick={allIsSelected ? this.handleSelectNone : this.handleSelectAll}>
                Select {allIsSelected ? 'none' : 'all'}
              </Button>
            </div>
            <ul className={styles.list}>
              {languages.map(lang => (
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
    )
  }
}

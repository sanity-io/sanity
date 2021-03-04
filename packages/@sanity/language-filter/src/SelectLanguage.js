/* eslint-disable complexity */
import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import Poppable from 'part:@sanity/components/utilities/poppable'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import Button from 'part:@sanity/components/buttons/default'
import ChevronDownIcon from 'part:@sanity/base/chevron-down-icon'
import styles from './styles/SelectLanguage.css'

const LanguagePropType = PropTypes.shape({
  id: PropTypes.string,
  title: PropTypes.string,
})

const ACTION_LABEL = 'Filter languages'

export default class SelectLanguage extends React.Component {
  static propTypes = {
    languages: PropTypes.arrayOf(LanguagePropType),
    defaultLanguages: PropTypes.arrayOf(PropTypes.string),
    selected: PropTypes.arrayOf(PropTypes.string),
    onChange: PropTypes.func,
  }

  state = {
    isOpen: false,
    id: Math.random().toString(36).substr(2, 6),
  }
  togglePoppableRef = React.createRef()

  handleToggle = (event) => {
    event.stopPropagation()
    this.setState((prevState) => {
      return {
        isOpen: !prevState.isOpen,
      }
    })
  }
  handleOpen = () => {
    this.setState({isOpen: true})
    this.inputFocus.setFocus()
  }
  handleClose = () => {
    this.setState({isOpen: false})
  }
  handleEsc = () => {
    this.handleClose()
  }
  handleClickOutside = (event) => {
    if (!event.target.textContent.includes(ACTION_LABEL)) {
      this.handleClose()
    }
  }

  selectLang = (langId) => {
    const {selected, onChange} = this.props
    onChange(selected.concat(langId))
  }

  unselectLang = (langId) => {
    const {selected, onChange} = this.props
    onChange(selected.filter((id) => id !== langId))
  }

  isDefaultLang = (langId) => {
    const {defaultLanguages} = this.props
    return defaultLanguages && defaultLanguages.includes(langId)
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
    const {id} = this.state
    const {languages, selected} = this.props
    const allIsSelected = languages.length === selected.length
    const toggleRef =
      this.togglePoppableRef &&
      this.togglePoppableRef.current &&
      this.togglePoppableRef.current._element

    return (
      <>
        <button
          type="button"
          className={classNames(styles.target, isOpen && styles.targetSelected)}
          data-open={isOpen}
          onClick={this.handleToggle}
          ref={this.togglePoppableRef}
          title={
            allIsSelected
              ? 'Filter language fields'
              : 'Displaying only fields for selected languages'
          }
          aria-label="Menu"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={id}
        >
          <div className={styles.targetValue}>
            {ACTION_LABEL} ({`${selected.length}/${languages.length}`})
          </div>
          <div className={styles.targetIcon}>
            <ChevronDownIcon />
          </div>
        </button>
        <Poppable
          onEscape={this.handleEsc}
          onClickOutside={this.handleClickOutside}
          placement="bottom"
          referenceElement={toggleRef}
          id={this.id}
        >
          {isOpen && (
            <div className={styles.root}>
              <div className={styles.functions}>
                <Button
                  inverted
                  onClick={allIsSelected ? this.handleSelectNone : this.handleSelectAll}
                  kind="simple"
                  padding="small"
                  autoFocus
                >
                  Select {allIsSelected ? 'none' : 'all'}
                </Button>
              </div>
              <ul className={styles.list}>
                {languages.map((lang) => {
                  const label = lang.title + (this.isDefaultLang(lang.id) ? ' (Default)' : '')
                  return (
                    <li className={styles.item} key={lang.id}>
                      <Checkbox
                        onChange={this.handleLangCheckboxChange}
                        data-lang-id={lang.id}
                        checked={selected.includes(lang.id)}
                        label={label}
                        disabled={this.isDefaultLang(lang.id)}
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </Poppable>
      </>
    )
  }
}

// @flow

/* eslint-disable complexity */

import React from 'react'
import classnames from 'classnames'
import enhanceWithClickOutside from 'react-click-outside'
import {ContainerQuery} from 'react-container-query'
import {Tooltip} from 'react-tippy'

import ArrowIcon from 'part:@sanity/base/angle-down-icon'
import Button from 'part:@sanity/components/buttons/default'
import ChevronDown from 'part:@sanity/base/chevron-down-icon'
import CloseIcon from 'part:@sanity/base/close-icon'
import FullscreenIcon from 'part:@sanity/base/fullscreen-icon'
import ValidationList from 'part:@sanity/components/validation/list'
import WarningIcon from 'part:@sanity/base/warning-icon'

import IS_MAC from '../utils/isMac'

import type {BlockContentFeatures, SlateValue, SlateEditor, Type} from '../typeDefs'

import AnnotationButtons from './AnnotationButtons'
import BlockStyleSelect from './BlockStyleSelect'
import DecoratorButtons from './DecoratorButtons'
import InsertMenu from './InsertMenu'
import ListItemButtons from './ListItemButtons'

import styles from './styles/Toolbar.css'

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editor: SlateEditor,
  editorValue: SlateValue,
  fullscreen: boolean,
  onFocus: (nextPath: []) => void,
  onToggleFullScreen: void => void,
  markers: [],
  style: {},
  type: Type,
  userIsWritingText: boolean
}

type State = {
  expanded: boolean,
  showValidationTooltip: boolean
}

const query = {
  [styles.largeContainer]: {
    minWidth: 600
  }
}

class Toolbar extends React.PureComponent<Props, State> {
  state = {
    expanded: false,
    showValidationTooltip: false
  }

  handleExpand = () => {
    this.setState({
      expanded: true
    })
  }

  handleContract = () => {
    this.setState({
      expanded: false
    })
  }

  handleClickOutside = () => {
    this.setState({
      expanded: false
    })
  }

  handleFocus = (focusPath: []) => {
    const {onFocus} = this.props
    onFocus(focusPath)
  }

  handleCloseValidationResults = () => {
    this.setState({showValidationTooltip: false})
  }

  handleToggleValidationResults = () => {
    this.setState(prevState => ({showValidationTooltip: !prevState.showValidationTooltip}))
  }

  render() {
    const {
      blockContentFeatures,
      editor,
      editorValue,
      fullscreen,
      markers,
      onFocus,
      onToggleFullScreen,
      style,
      type,
      userIsWritingText
    } = this.props

    if (!editor) {
      return null
    }

    const {expanded, showValidationTooltip} = this.state

    const insertItems = blockContentFeatures.types.inlineObjects.concat(
      blockContentFeatures.types.blockObjects
    )

    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')
    const warnings = validation.filter(marker => marker.level === 'warning')

    return (
      <ContainerQuery query={query}>
        {params => (
          <div
            className={`
              ${styles.root}
              ${classnames(params)}
              ${fullscreen ? ` ${styles.fullscreen}` : ''}
            `}
            style={style}
          >
            <div className={styles.primary}>
              <div className={styles.blockFormatContainer} onClick={this.handleContract}>
                <BlockStyleSelect
                  editor={editor}
                  blockContentFeatures={blockContentFeatures}
                  editorValue={editorValue}
                />
              </div>
              <Button className={styles.expandButton} onClick={this.handleExpand} kind="simple">
                More&nbsp;
                <span className={styles.arrow}>
                  <ArrowIcon color="inherit" />
                </span>
              </Button>
              <div className={`${styles.compactable} ${expanded ? styles.expanded : ''}`}>
                {blockContentFeatures.decorators.length > 0 && (
                  <div className={styles.decoratorButtonsContainer}>
                    <DecoratorButtons
                      blockContentFeatures={blockContentFeatures}
                      editor={editor}
                      editorValue={editorValue}
                    />
                  </div>
                )}
                {blockContentFeatures.lists.length > 0 && (
                  <div className={styles.decoratorButtonsContainer}>
                    <ListItemButtons
                      blockContentFeatures={blockContentFeatures}
                      editor={editor}
                      editorValue={editorValue}
                    />
                  </div>
                )}
                {blockContentFeatures.annotations.length > 0 && (
                  <div className={styles.annotationButtonsContainer}>
                    <AnnotationButtons
                      blockContentFeatures={blockContentFeatures}
                      editor={editor}
                      editorValue={editorValue}
                      onFocus={onFocus}
                      userIsWritingText={userIsWritingText}
                    />
                  </div>
                )}
                {insertItems.length > 0 && (
                  <div className={styles.insertContainer}>
                    <InsertMenu
                      blockTypes={blockContentFeatures.types.blockObjects}
                      editor={editor}
                      editorValue={editorValue}
                      inlineTypes={blockContentFeatures.types.inlineObjects}
                      onFocus={onFocus}
                      type={type}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className={styles.secondary}>
              {fullscreen &&
                (errors.length > 0 || warnings.length > 0) && (
                  <Tooltip
                    arrow
                    duration={100}
                    html={
                      <ValidationList
                        markers={validation}
                        showLink
                        isOpen={showValidationTooltip}
                        documentType={type}
                        onClose={this.handleCloseValidationResults}
                        onFocus={this.handleFocus}
                      />
                    }
                    interactive
                    onRequestClose={this.handleCloseValidationResults}
                    open={showValidationTooltip}
                    position="bottom"
                    style={{padding: 0}}
                    theme="light noPadding"
                    trigger="click"
                  >
                    <Button
                      color="danger"
                      icon={WarningIcon}
                      kind="simple"
                      onClick={this.handleToggleValidationResults}
                      padding="small"
                    >
                      {errors.length}
                      <span style={{paddingLeft: '0.5em'}}>
                        <ChevronDown />
                      </span>
                    </Button>
                  </Tooltip>
                )}
              <div className={styles.fullscreenButtonContainer} onClick={this.handleContract}>
                <Button
                  kind="simple"
                  onClick={onToggleFullScreen}
                  title={`Open in fullscreen (${IS_MAC ? 'cmd' : 'ctrl'}+enter)`}
                  icon={fullscreen ? CloseIcon : FullscreenIcon}
                />
              </div>
            </div>
          </div>
        )}
      </ContainerQuery>
    )
  }
}

export default enhanceWithClickOutside(Toolbar)

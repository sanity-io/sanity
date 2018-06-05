// @flow
/* eslint-disable complexity */

import React from 'react'

import AnnotationButtons from './AnnotationButtons'
import BlockStyleSelect from './BlockStyleSelect'
import InsertMenu from './InsertMenu'
import Button from 'part:@sanity/components/buttons/default'
import CloseIcon from 'part:@sanity/base/close-icon'
import DecoratorButtons from './DecoratorButtons'
import FullscreenIcon from 'part:@sanity/base/fullscreen-icon'
import ListItemButtons from './ListItemButtons'
import {ContainerQuery} from 'react-container-query'
import classnames from 'classnames'
import ArrowIcon from 'part:@sanity/base/angle-down-icon'
import enhanceWithClickOutside from 'react-click-outside'
import {Tooltip} from '@sanity/react-tippy'
import type {BlockContentFeatures, SlateValue, SlateChange, Type} from '../typeDefs'
import ValidationList from 'part:@sanity/components/validation/list'
import WarningIcon from 'part:@sanity/base/warning-icon'
import ChevronDown from 'part:@sanity/base/chevron-down-icon'

import styles from './styles/Toolbar.css'

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editorValue: SlateValue,
  focusPath: [],
  fullscreen: boolean,
  onChange: (change: SlateChange) => void,
  onFocus: (nextPath: []) => void,
  onToggleFullScreen: void => void,
  style: {},
  type: Type
}

const query = {
  [styles.largeContainer]: {
    minWidth: 600
  }
}

class Toolbar extends React.PureComponent<Props> {
  state = {
    expanded: false
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

  render() {
    const {
      blockContentFeatures,
      fullscreen,
      editorValue,
      focusPath,
      onChange,
      onFocus,
      onToggleFullScreen,
      style,
      type,
      markers
    } = this.props

    const {expanded} = this.state

    const insertItems = blockContentFeatures.types.inlineObjects.concat(
      blockContentFeatures.types.blockObjects
    )

    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')
    const warnings = validation.filter(marker => marker.level === 'warning')

    console.log('errors', errors)

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
            <div className={styles.blockFormatContainer} onClick={this.handleContract}>
              <BlockStyleSelect
                editorValue={editorValue}
                onChange={onChange}
                blockContentFeatures={blockContentFeatures}
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
                    editorValue={editorValue}
                    onChange={onChange}
                    blockContentFeatures={blockContentFeatures}
                  />
                </div>
              )}
              {blockContentFeatures.lists.length > 0 && (
                <div className={styles.decoratorButtonsContainer}>
                  <ListItemButtons
                    editorValue={editorValue}
                    onChange={onChange}
                    blockContentFeatures={blockContentFeatures}
                  />
                </div>
              )}
              {blockContentFeatures.annotations.length > 0 && (
                <div className={styles.annotationButtonsContainer}>
                  <AnnotationButtons
                    editorValue={editorValue}
                    onChange={onChange}
                    onFocus={onFocus}
                    focusPath={focusPath}
                    blockContentFeatures={blockContentFeatures}
                  />
                </div>
              )}

              {insertItems.length > 0 && (
                <div className={styles.insertContainer}>
                  <InsertMenu
                    type={type}
                    blockTypes={blockContentFeatures.types.blockObjects}
                    inlineTypes={blockContentFeatures.types.inlineObjects}
                    editorValue={editorValue}
                    onChange={onChange}
                    onFocus={onFocus}
                  />
                </div>
              )}
            </div>
            {fullscreen &&
              (errors.length > 0 || warnings.length > 0) && (
                <Tooltip
                  arrow
                  theme="light noPadding"
                  trigger="click"
                  position="bottom"
                  interactive
                  duration={100}
                  onRequestClose={this.handleCloseValidationResults}
                  style={{padding: 0}}
                  html={
                    <ValidationList
                      markers={validation}
                      showLink
                      documentType={type}
                      onClose={this.handleCloseValidationResults}
                      onFocus={this.handleFocus}
                    />
                  }
                >
                  <Button
                    color="danger"
                    icon={WarningIcon}
                    padding="small"
                    kind="simple"
                    onClick={this.handleToggleValidationResults}
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
                icon={fullscreen ? CloseIcon : FullscreenIcon}
              />
            </div>
          </div>
        )}
      </ContainerQuery>
    )
  }
}

export default enhanceWithClickOutside(Toolbar)

import React from 'react'
import DefaultButton from 'part:@sanity/components/buttons/default'
import Details from '../common/Details'
import styles from './InvalidValue.css'

import {InvalidValueResolution, PortableTextBlock} from '@sanity/portable-text-editor'

type InvalidValueProps = {
  resolution: InvalidValueResolution
  value: PortableTextBlock[]
  onChange: (...args: any[]) => any
  onIgnore: () => void
}

const setAutoHeight = el => {
  if (el) {
    el.style.height = `${Math.min(300, el.scrollHeight)}px`
    el.style.padding = `${4}px`
    el.style.overflow = 'auto'
  }
}

export default class InvalidValue extends React.PureComponent<InvalidValueProps, {}> {
  handleAction = (): void => {
    const resolution = this.props.resolution
    if (resolution) {
      const {patches} = resolution
      this.props.onChange({type: 'mutation', patches})
    }
  }
  handleIgnore = (): void => {
    this.props.onIgnore()
  }
  render() {
    const {value, resolution} = this.props
    return (
      <div className={styles.root} tabIndex={0}>
        <h3>Invalid portable text value</h3>
        {resolution.description}
        <Details>
          <h4>The current value is:</h4>
          <textarea
            ref={setAutoHeight}
            className={styles.currentValueDump}
            readOnly
            value={JSON.stringify(resolution.item, null, 2)}
          />
        </Details>
        {resolution.action && (
          <div className={styles.removeButtonWrapper}>
            <DefaultButton color="danger" onClick={this.handleAction}>
              {resolution.action}
            </DefaultButton>
            <DefaultButton color="secondary" onClick={this.handleIgnore}>
              Ignore
            </DefaultButton>
          </div>
        )}
      </div>
    )
  }
}

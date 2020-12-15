import React from 'react'
import {InvalidValueResolution, PortableTextBlock} from '@sanity/portable-text-editor'
import Warning from '../Warning'
import styles from '../ObjectInput/styles/UnknownFields.css'
import {Button} from '@sanity/ui'

type InvalidValueProps = {
  resolution: InvalidValueResolution
  value: PortableTextBlock[]
  onChange: (...args: any[]) => any
  onIgnore: () => void
}

export default class InvalidValue extends React.PureComponent<InvalidValueProps> {
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
    const {resolution} = this.props
    const message = (
      <>
        <p>{resolution.description}</p>
        <p>
          <pre className={styles.inspectValue}>{JSON.stringify(resolution.item, null, 2)}</pre>
        </p>
        {resolution.action && (
          <>
            <div className={styles.buttonWrapper}>
              <Button tone="primary" onClick={this.handleAction} text={resolution.action} />
              <Button mode="ghost" onClick={this.handleIgnore} text="Ignore" />
            </div>
            <p>
              It’s generally safe to perform the action above, but if you are in doubt, get in touch
              with those responsible for configuring your studio.
            </p>
          </>
        )}
      </>
    )
    return <Warning heading="Invalid portable text value" message={message} />
  }
}

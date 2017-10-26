import React from 'react'
import styles from './styles/GettingStartedPane.css'
import Pane from 'part:@sanity/components/panes/default'

export default class GetStartedPane extends React.PureComponent {

  render() {
    return (
      <Pane {...this.props}>
        <div className={styles.content}>
          Your schema needs a <code>type</code> or two for us to have anything to show here.
          Read our guide on how to get started with {' '}
          <strong>
            <a href="https://www.sanity.io/docs/content-studio/the-schema" target="_blank" rel="noopener noreferrer">
              creating schemas
            </a>
          </strong>.
        </div>
      </Pane>
    )
  }
}

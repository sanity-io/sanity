import React from 'react'
import ProgressBar from 'component:@sanity/components/progress/bar'
import {storiesOf, action} from 'component:@sanity/storybook'

import centered from '../storybook-addons/centered.js'
import role from '../storybook-addons/role.js'

class ProgressBarImplementation extends React.Component {

  constructor(...args) {
    super(...args)

    this.state = {
      completion: 0
    }
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      this.setState({
        completion: this.state.completion + 0.8
      })
      if (this.state.completion >= 100) {
        this.setState({
          completion: 0
        })
      }
    }, 100)
  }

  componentWillUnmount() {
    console.log('Did unmount')
    clearInterval(this.interval)
  }

  render() {
    return (
      <ProgressBar style={{width: '20em'}} completion={this.state.completion} showPercent />
    )
  }
}

storiesOf('Progress')
.addDecorator(centered)
.addWithRole(
  'Progress bar',
  `
    Default progress bar.
  `,
  'component:@sanity/components/progress/bar',
  () => (
    <ProgressBar style={{width: '20em'}} />
  ),
  {propTables: [ProgressBar]}
)
.addWithRole(
  'Progress bar (20%)',
  `
    Default progress bar.
  `,
  'component:@sanity/components/progress/bar',
  () => (
    <ProgressBar style={{width: '20em'}} completion={20} />
  ),
  {propTables: [ProgressBar]}
)
.addWithRole(
  'Progress bar (100%)',
  `
    Default progress bar.
  `,
  'component:@sanity/components/progress/bar',
  () => (
    <ProgressBar style={{width: '20em'}} completion={100} />
  ),
  {propTables: [ProgressBar]}
)
.addWithRole(
  'Progress bar (showPercent)',
  `
    Default progress bar showing percent.
  `,
  'component:@sanity/components/progress/bar',
  () => (
    <ProgressBar style={{width: '20em'}} completion={22} showPercent />
  ),
  {propTables: [ProgressBar]}
)

.addWithRole(
  'Progress bar (with text)',
  `
    Default progress bar showing percent.
  `,
  'component:@sanity/components/progress/bar',
  () => (
    <ProgressBar style={{width: '20em'}} completion={22} showPercent text="Downloaded 5.1 of 8.2Mb" />
  ),
  {propTables: [ProgressBar]}
)
.addWithRole(
  'Progress bar example',
  `
    Default progress bar showing percent.
  `,
  'component:@sanity/components/progress/bar',
  () => (
    <ProgressBarImplementation />
  ),
  {propTables: [ProgressBar]}
)

import React from 'react'
import ProgressBar from 'part:@sanity/components/progress/bar'
import ProgressCircle from 'part:@sanity/components/progress/circle'

import {storiesOf} from 'part:@sanity/storybook'

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
    clearInterval(this.interval)
  }

  render() {
    return (
      <ProgressBar style={{width: '20em'}} completion={this.state.completion} showPercent />
    )
  }
}

storiesOf('Progress')
.addWithInfo(
  'Progress bar',
  `
    Default progress bar.
  `,
  () => (
    <ProgressBar style={{width: '20em'}} />
  ),
  {
    propTables: [ProgressBar],
    role: 'part:@sanity/components/progress/bar'
  }
)
.addWithInfo(
  'Progress bar (20%)',
  `
    Default progress bar.
  `,
  () => (
    <ProgressBar style={{width: '20em'}} completion={20} />
  ),
  {
    propTables: [ProgressBar],
    role: 'part:@sanity/components/progress/bar'
  }
)
.addWithInfo(
  'Progress bar (100%)',
  `
    Default progress bar.
  `,
  () => (
    <ProgressBar style={{width: '20em'}} completion={100} />
  ),
  {
    propTables: [ProgressBar],
    role: 'part:@sanity/components/progress/bar'
  }
)
.addWithInfo(
  'Progress bar (showPercent)',
  `
    Default progress bar showing percent.
  `,
  () => (
    <ProgressBar style={{width: '20em'}} completion={22} showPercent />
  ),
  {
    propTables: [ProgressBar],
    role: 'part:@sanity/components/progress/bar'
  }
)

.addWithInfo(
  'Progress bar (with text)',
  `
    Default progress bar showing percent.
  `,
  () => (
    <ProgressBar style={{width: '20em'}} completion={22} showPercent text="Downloaded 5.1 of 8.2Mb" />
  ),
  {
    propTables: [ProgressBar],
    role: 'part:@sanity/components/progress/bar'
  }
)
.addWithInfo(
  'Progress bar example',
  `
    Default progress bar showing percent.
  `,
  () => (
    <ProgressBarImplementation />
  ),
  {
    propTables: [ProgressBar],
    role: 'part:@sanity/components/progress/bar'
  }
)
.addWithInfo(
  'Progress circle',
  `
    Progress circle.
  `,
  () => (
    <ProgressCircle style={{width: '20em'}} />
  ),
  {
    propTables: [ProgressBar],
    role: 'part:@sanity/components/progress/bar'
  }
)
.addWithInfo(
  'Progress circle 20%',
  `
    Progress circle.
  `,
  () => (
    <ProgressCircle style={{width: '20em'}} completion="20" />
  ),
  {
    propTables: [ProgressBar],
    role: 'part:@sanity/components/progress/circle'
  }
)

.addWithInfo(
  'Progress circle 100%',
  `
    Progress circle.
  `,
  () => (
    <ProgressCircle style={{width: '20em'}} completion="100" />
  ),
  {
    propTables: [ProgressBar],
    role: 'part:@sanity/components/progress/circle'
  }
)

.addWithInfo(
  'Progress circle (show percent)',
  `
    Progress circle.
  `,
  () => (
    <ProgressCircle style={{width: '20em'}} completion="50" showPercent />
  ),
  {
    propTables: [ProgressBar],
    role: 'part:@sanity/components/progress/circle'
  }
)
.addWithInfo(
  'Progress circle (show percent & text)',
  `
    Progress circle.
  `,
  () => (
    <ProgressCircle style={{width: '20em'}} completion="50" showPercent text="This is text…" />
  ),
  {
    propTables: [ProgressBar],
    role: 'part:@sanity/components/progress/circle'
  }
)

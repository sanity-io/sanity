import React from 'react'
import ProgressBar from 'component:@sanity/components/progress/bar'
import {storiesOf} from 'component:@sanity/storybook'

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
    role: 'component:@sanity/components/progress/bar'
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
    role: 'component:@sanity/components/progress/bar'
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
    role: 'component:@sanity/components/progress/bar'
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
    role: 'component:@sanity/components/progress/bar'
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
    role: 'component:@sanity/components/progress/bar'
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
    role: 'component:@sanity/components/progress/bar'
  }
)

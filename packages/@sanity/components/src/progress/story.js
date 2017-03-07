/* eslint-disable react/no-multi-comp */
import React from 'react'
import ProgressBar from 'part:@sanity/components/progress/bar'
import ProgressCircle from 'part:@sanity/components/progress/circle'
import {withKnobs, number} from 'part:@sanity/storybook/addons/knobs'
import {storiesOf} from 'part:@sanity/storybook'

const style = {
  width: '80vw',
  margin: '50vw auto'
}

const centered = function (storyFn) {
  return <div style={style}>{storyFn()}</div>
}


class ProgressBarImplementation extends React.Component {

  constructor(...args) {
    super(...args)

    this.state = {
      completion: 0
    }
  }

  reset = () => {
    this.setState({
      completion: 0
    })
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      if (this.state.completion < 100) {
        this.setState({
          completion: this.state.completion + 0.8
        })
      }
      if (this.state.completion >= 100) {
        setTimeout(this.reset, 1000)
      }
    }, 50)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    return (
      <div>
        <ProgressBar percent={this.state.completion} showPercent />
        <ProgressCircle
          style={{width: '20em'}}
          percent={this.state.completion}
          completed={this.state.completion >= 100}
          showPercent
        />
      </div>
    )
  }
}

storiesOf('Progress')
.addDecorator(centered)
.addDecorator(withKnobs)
.addWithInfo(
  'Progress bar',
  `
    Default progress bar.
  `,
  () => (
    <ProgressBar style={{width: '20em'}} percent={number('Percentage', 10)} />
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
    <ProgressBar style={{width: '20em'}} percent={20} />
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
    <ProgressBar style={{width: '20em'}} percent={100} />
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
    <ProgressBar style={{width: '20em'}} percent={22} showPercent />
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
    <ProgressBar style={{width: '20em'}} percent={22} showPercent text="Downloaded 5.1 of 8.2Mb" />
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
    <ProgressCircle style={{width: '20em'}} percent="20" />
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
    <ProgressCircle style={{width: '20em'}} percent="100" />
  ),
  {
    propTables: [ProgressBar],
    role: 'part:@sanity/components/progress/circle'
  }
)

.addWithInfo(
  'Progress circle 100% & complete',
  `
    Progress circle.
  `,
  () => (
    <ProgressCircle style={{width: '20em'}} percent="100" completed />
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
    <ProgressCircle style={{width: '20em'}} percent="50" showPercent />
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
    <ProgressCircle style={{width: '20em'}} percent="50" showPercent text="This is text…" />
  ),
  {
    propTables: [ProgressBar],
    role: 'part:@sanity/components/progress/circle'
  }
)

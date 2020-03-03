import summarizers from 'part:@sanity/visual-diff/summarizers?'
import visualizers from 'part:@sanity/visual-diff/visualizers?'
import defaultSummarizers from './defaultSummarizers'
import defaultVisualizers from './defaultVisualizers'

const resolver = () => {
  const allSummarizers = {...defaultSummarizers, ...summarizers}
  const allVisualizers = {...defaultVisualizers, ...visualizers}

  return {
    summarizers: allSummarizers,
    visualizers: allVisualizers
  }
}

export default resolver

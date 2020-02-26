import summarizers from 'part:@sanity/visual-diff/summarizers?'
import differs from 'part:@sanity/visual-diff/differs?'
import defaultSummarizers from './defaultSummarizers'
import defaultDiffers from './defaultDiffers'

const resolver = () => {
  const allSummarizers = {...defaultSummarizers, ...summarizers}
  const allDiffers = {...defaultDiffers, ...differs}

  return {
    summarizers: allSummarizers,
    differs: allDiffers
  }
}

export default resolver

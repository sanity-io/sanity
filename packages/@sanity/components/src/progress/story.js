import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {storiesOf} from 'part:@sanity/storybook'
import {ProgressBarStory} from './stories/progressBar'
import {ProgressCircleStory} from './stories/progressCircle'

storiesOf('@sanity/components/progress', module)
  .addDecorator(withKnobs)
  .add('Progress bar', ProgressBarStory)
  .add('Progress circle', ProgressCircleStory)

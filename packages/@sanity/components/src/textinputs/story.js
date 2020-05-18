import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {CustomStyleStory} from './stories/customStyle'
import {DefaultStory} from './stories/default'
import {DefaultTestStory} from './stories/defaultTest'

storiesOf('@sanity/components/textinputs', module)
  .addDecorator(withKnobs)
  .add('Default', DefaultStory)
  .add('Custom style', CustomStyleStory)
  .add('Default (test)', DefaultTestStory)

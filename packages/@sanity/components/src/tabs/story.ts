import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {DefaultStory} from './stories/default'
import {WithIconsStory} from './stories/withIcons'
import {ManyStory} from './stories/many'

storiesOf('@sanity/components/tabs', module)
  .addDecorator(withKnobs)
  .add('Default', DefaultStory)
  .add('With icons', WithIconsStory)
  .add('With many tabs', ManyStory)

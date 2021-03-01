import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {TagsStory} from './stories/tags'
import {TagsTestStory} from './stories/tagsTest'

storiesOf('@sanity/components/tags', module)
  .addDecorator(withKnobs)
  .add('Tags', TagsStory)
  .add('Tags (test)', TagsTestStory)

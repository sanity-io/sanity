import {storiesOf} from 'part:@sanity/storybook'
import {BasicStory} from './stories/basic'
import {HotkeysStory} from './stories/hotkeys'

storiesOf('@sanity/components/typography', module)
  .add('Basic', BasicStory, {inline: false})
  .add('Hotkeys', HotkeysStory)

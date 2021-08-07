// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {storiesOf} from 'part:@sanity/storybook'
import {BasicStory} from './stories/basic'
import {HotkeysStory} from './stories/hotkeys'

storiesOf('@sanity/components/typography', module)
  .add('Basic', BasicStory, {inline: false})
  .add('Hotkeys', HotkeysStory)

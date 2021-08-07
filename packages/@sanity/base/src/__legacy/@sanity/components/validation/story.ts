// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {ListStory} from './stories/list'
import {ListItemStory} from './stories/listItem'
import {StatusStory} from './stories/status'

storiesOf('@sanity/components/validation', module)
  .addDecorator(withKnobs)
  .add('Status', StatusStory)
  .add('List', ListStory)
  .add('ListItem', ListItemStory)

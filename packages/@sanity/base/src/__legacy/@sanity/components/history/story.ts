// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {ListStory} from './stories/list'
import {ListItemStory} from './stories/listItem'

storiesOf('@sanity/components/history', module)
  .addDecorator(withKnobs)
  .add('List', ListStory)
  .add('List item', ListItemStory)

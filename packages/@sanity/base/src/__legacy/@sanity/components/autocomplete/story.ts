// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {storiesOf} from 'part:@sanity/storybook'
import {DefaultStory} from './stories/default'
import {DefaultWithSuggestionsStory} from './stories/defaultWithSuggestions'

storiesOf('@sanity/components/autocomplete', module)
  .add('Default', DefaultStory)
  .add('Default with suggestions', DefaultWithSuggestionsStory)

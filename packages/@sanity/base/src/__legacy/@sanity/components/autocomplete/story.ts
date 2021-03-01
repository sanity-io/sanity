import {storiesOf} from 'part:@sanity/storybook'
import {DefaultStory} from './stories/default'
import {DefaultWithSuggestionsStory} from './stories/defaultWithSuggestions'

storiesOf('@sanity/components/autocomplete', module)
  .add('Default', DefaultStory)
  .add('Default with suggestions', DefaultWithSuggestionsStory)

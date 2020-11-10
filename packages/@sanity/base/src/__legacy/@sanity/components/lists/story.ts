import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {DefaultStory} from './stories/default'
import {SortableStory} from './stories/sortable'
import {CreateDocumentStory} from './stories/createDocument'

storiesOf('@sanity/components/list', module)
  .addDecorator(withKnobs)
  .add('Default', DefaultStory)
  .add('Sortable', SortableStory)
  .add('Create document', CreateDocumentStory)

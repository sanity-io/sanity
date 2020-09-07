import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {BlockStory} from './stories/block'
import {BlockImageStory} from './stories/blockImage'
import {CardStory} from './stories/card'
import {CreateDocumentStory} from './stories/createDocument'
import {DefaultStory} from './stories/default'
import {DetailStory} from './stories/detail'
import {InlineStory} from './stories/inline'
import {MediaStory} from './stories/media'
import {WithSanityIconStory} from './stories/withSanityIcon'

storiesOf('@sanity/components/previews', module)
  .addDecorator(withKnobs)
  .add('Default', DefaultStory)
  .add('Card', CardStory)
  .add('Detail', DetailStory)
  .add('Media', MediaStory)
  .add('Inline', InlineStory)
  .add('Block', BlockStory)
  .add('Block image', BlockImageStory)
  .add('Create document', CreateDocumentStory)
  .add('With Sanity icon', WithSanityIconStory)

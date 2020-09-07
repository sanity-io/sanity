import {storiesOf} from 'part:@sanity/storybook'
import {List as GridList} from 'part:@sanity/components/lists/grid'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {MediaPreviewStory} from './stories/mediaPreview'
import {MediaPreviewSortableStory} from './stories/mediaPreviewSortable'
import {CardsStory} from './stories/cards'

storiesOf('@sanity/components/list (grid)', module)
  .addDecorator(withKnobs)
  .add('MediaPreview', MediaPreviewStory)
  .add('MediaPreview (sortable)', MediaPreviewSortableStory, {
    propTables: [GridList],
    role: 'part:@sanity/components/lists/grid'
  })
  .add('Cards', CardsStory)

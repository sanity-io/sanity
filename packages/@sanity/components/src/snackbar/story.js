import React from 'react'
import Snackbar from 'part:@sanity/components/snackbar/item'
import {storiesOf, addDecorator} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import SnackbarProvider from 'part:@sanity/components/snackbar/provider'
import {DefaultStory} from './stories/default'
import {CustomIconStory} from './stories/customIcon'
import {CustomOnCloseStory} from './stories/customOnClose'
import {StackedStory} from './stories/stacked'
import {WithChildrenStory} from './stories/withChildren'
import {TransitionsStory} from './stories/transitions'

const Provider = storyFn => (
  <Sanity part="part:@sanity/components/snackbar/item" propTables={[Snackbar]}>
    <SnackbarProvider>{storyFn()}</SnackbarProvider>
  </Sanity>
)

addDecorator(Provider)
addDecorator(withKnobs)

storiesOf('@sanity/components/snackbar', module)
  .add('Default', DefaultStory)
  .add('Custom icon', CustomIconStory)
  .add('Custom onClose', CustomOnCloseStory)
  .add('Stacked', StackedStory)
  .add('With children', WithChildrenStory)
  .add('Transitions', TransitionsStory)

import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {BrandLogoStory} from './stories/brandLogo'
import {IconsStory} from './stories/icons'
import {SanityAlphaStory} from './stories/sanityAlpha'
import {SanityIconStory} from './stories/sanityIcon'
import {SanityLogoStory} from './stories/sanityLogo'
import {SanityStudioLogoStory} from './stories/sanityStudioLogo'

storiesOf('@sanity/components/icons', module)
  .addDecorator(withKnobs)
  .add('Icons', IconsStory, {inline: false})

storiesOf('@sanity/components/logos', module)
  .addDecorator(withKnobs)
  .add('Sanity logo (stencil)', SanityLogoStory)
  .add('Sanity logo (icon)', SanityIconStory)
  .add('Sanity logo', SanityAlphaStory)
  .add('Brand', BrandLogoStory)
  .add('Sanity Studio', SanityStudioLogoStory)

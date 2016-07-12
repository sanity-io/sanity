import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import Faker from 'Faker'

import styles from './styles/story.css'
import headings from 'style:@sanity/base/theme/typography/headings'
import textBlocks from 'style:@sanity/base/theme/typography/text-blocks'

storiesOf('Typography').addWithInfo(
  'Basic',
  `
    ## Headings

    ### Use in JS
    import headings from 'style:@sanity/base/theme/typography/headings'
    <h1 className={headings.heading1}>This is the big heading</h1>

    ### Use in CSS
    - composes: heading1 from "style:@sanity/base/theme/typography/headings"
    - composes: heading2 from ...
    - composes: heading3 from ...
    - composes: heading4 from ...
    - composes: heading5 from ...

    ## Text blocks

    ### Use in JS
    import textBlocks from 'style:@sanity/base/theme/typography/text-blocks'
    <p className={textBlocks.paragraph}</p>

    ### Use in CSS
    - composes: lead from "style:@sanity/base/theme/typography/text-blocks"
    - composes: paragraph from ...


  `,
  () => {
    return (
      <article className={styles.wrapper}>
        <h1 className={headings.heading1}>Heading 1</h1>
        <p className={textBlocks.lead}>{Faker.Lorem.paragraphs(2)}</p>
        <p className={textBlocks.paragraph}>{Faker.Lorem.paragraphs(2)}</p>
        <h2 className={headings.heading2}>Heading 2</h2>
        <p className={textBlocks.paragraph}>{Faker.Lorem.paragraphs(2)}</p>
        <p className={textBlocks.paragraph}>{Faker.Lorem.paragraphs(2)}</p>

        <h3 className={headings.heading3}>Heading 3</h3>
        <p className={textBlocks.paragraph}>{Faker.Lorem.paragraphs(1)}</p>
        <p className={textBlocks.paragraph}>{Faker.Lorem.paragraphs(1)}</p>

        <h4 className={headings.heading4}>Heading 4</h4>
        <p className={textBlocks.paragraph}>{Faker.Lorem.paragraphs(1)}</p>
        <p className={textBlocks.paragraph}>{Faker.Lorem.paragraphs(1)}</p>

        <h5 className={headings.heading5}>Heading 5</h5>
        <p className={textBlocks.paragraph}>{Faker.Lorem.paragraphs(1)}</p>

        <h5 className={headings.heading5}>Heading 5</h5>
        <p className={textBlocks.paragraph}>{Faker.Lorem.paragraphs(1)}</p>
      </article>
    )
  },
  {inline: false}
)

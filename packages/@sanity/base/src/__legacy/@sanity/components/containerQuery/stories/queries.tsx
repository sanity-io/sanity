import {ContainerQuery} from 'part:@sanity/components/container-query'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React from 'react'

import styles from './queries.css'

export function QueriesStory() {
  return (
    <Sanity part="part:@sanity/components/container" propTables={[ContainerQuery]}>
      <ContainerQuery className={styles.root}>ContainerQuery</ContainerQuery>
    </Sanity>
  )
}

// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

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

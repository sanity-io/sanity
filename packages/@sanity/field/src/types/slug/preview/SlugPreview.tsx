import React from 'react'
import {PreviewComponent} from '../../../preview/types'
import {Slug} from '../types'

export const SlugPreview: PreviewComponent<Slug> = ({value}) => <>{value.current}</>

import React from 'react'
import MyGaComponent from '../components/MyGaComponent'
import { withDocument } from 'part:@sanity/form-builder'

const SimpleWidget = withDocument(props => {
  const {document = {}} = props
  return (
    <div>I know about the document, like the title <b>{document.title}</b></div>
  )
})

export default {
  name: 'withWidgetTest',
  type: 'document',
  title: 'With widget test',
  fields: [
    {
      title: 'Title',
      name: 'title',
      type: 'string'
    },
    {
      title: 'Slug',
      name: 'slug',
      type: 'slug'
    },
    {
      title: 'Bounce rate last 30 days',
      name: 'bounceWidget',
      type: 'widget',
      component: MyGaComponent,
      options: {
        gaConfig: doc => doc && ({
          reportType: 'ga',
          query: {
            dimensions: 'ga:date',
            metrics: 'ga:bounceRate, ga:bounces',
            'start-date': '30daysAgo',
            'end-date': 'yesterday',
            filters: `ga:pagePath==/${doc.slug && doc.slug.current || ''}`
          },
          chart: {
            type: 'LINE',
            options: {
              width: '100%'
            }
          }
        })
      }
    },
    {
      title: 'Page views last 30 days',
      name: 'pageViewsWidget',
      type: 'widget',
      component: MyGaComponent,
      options: {
        gaConfig: doc => doc && ({
          reportType: 'ga',
          query: {
            dimensions: 'ga:date',
            metrics: 'ga:pageviews',
            'start-date': '30daysAgo',
            'end-date': 'yesterday',
            filters: `ga:pagePath==/${doc.slug && doc.slug.current || ''}`
          },
          chart: {
            type: 'LINE',
            options: {
              width: '100%'
            }
          }
        })
      }
    },
    {
      name: 'sampleWigdet',
      type: 'widget',
      component: SimpleWidget
    }
  ]
}

import React from 'react'
import Icon from '../components/icon'

export default {
  name: 'aggregate',
  title: 'Aggregate data',
  type: 'document',
  __experimental_actions: [],
  icon: () => <Icon emoji="📊" />,
  fieldsets: [
    {
      name: 'dateRange',
      title: 'Date range',
      options:  {
        columns: 2
      }
    }
  ],
  initialValue: {
    subset: 'day'
  },
  fields: [
    {
      name: 'subset',
      title: 'Subset',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          'day',
          '7-days',
          '30-days',
          'week',
          'month',
          'quarter',
          'year',
          'all'
        ]
      }
    },
    {
      name: 'dateFrom',
      title: 'From',
      type: 'date',
      readOnly: true,
      fieldset: 'dateRange'
    },
    {
      name: 'dateTo',
      title: 'To',
      type: 'date',
      readOnly: true,
      fieldset: 'dateRange'
    },
    {
      name: 'volume',
      title: 'Volume',
      readOnly: true,
      type: 'number'
    },
    {
      name: 'activity',
      title: 'Activity',
      readOnly: true,
      type: 'number'
    },
    {
      name: 'agents',
      title: 'Agents',
      type: 'array',
      of: [{ type: 'simpleStats' }],
      readOnly: true,
      options: {
        sortable: false
      }
    },
    {
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'simpleStats' }],
      readOnly: true,
      options: {
        sortable: false
      }
    },
    {
      name: 'channels',
      title: 'Channels',
      type: 'array',
      of: [{ type: 'simpleStats' }],
      readOnly: true,
      options: {
        sortable: false
      }
    },
    {
      name: 'coverage',
      title: 'Coverage',
      type: 'array',
      of: [{ type: 'simpleStats' }],
      readOnly: true,
      options: {
        sortable: false
      }
    },
    {
      name: 'resolution',
      title: 'Resolution rate',
      type: 'array',
      of: [{ type: 'simpleStats' }],
      readOnly: true,
      options: {
        sortable: false
      }
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'simpleStats' }],
      readOnly: true,
      options: {
        sortable: false
      }
    },
    {
      name: 'participants',
      title: 'Participants',
      type: 'number',
      readOnly: true
    },
    {
      name: 'threadLength',
      title: 'Average thread length',
      type: 'number',
      readOnly: true
    },
    {
      name: 'firstResponse',
      title: 'Average time to first response',
      type: 'number',
      readOnly: true
    },
    {
      name: 'responseTime',
      title: 'Average response time',
      type: 'number',
      readOnly: true
    },
    {
      name: 'sources',
      title: 'Sources',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            {type: 'aggregate'},
            {type: 'ticket'}
          ],
          options: {
            filter: ({document}) => {
              if (!document.subset || document.subset !== 'day') {
                return {
                  filter: '!(_type == "ticket")'
                }
              }

              return {
                filter: '!(_type == "aggregate")'
              }
            }
          }
        }
      ],
      readOnly: true
    }
  ],
  orderings: [
    {
      title: 'Subset and date',
      name: 'subsetDateDesc',
      by: [
        {field: 'subset', direction: 'desc'},
        {field: 'dateFrom', direction: 'desc'},
        {field: 'dateTo', direction: 'desc'}
      ]
    }
  ],
  preview: {
    select: {
      subset: 'subset',
      dateFrom: 'dateFrom',
      dateTo: 'dateTo',
      id: '_id'
    },
    prepare({ subset, dateFrom, dateTo, id }) {
      let options = { hour12: false };
      let from = new Date(dateFrom)
      let to = new Date(dateTo)

      from = `${from.getFullYear()}/${from.getMonth() + 1}/${from.getDate()}`
      to = `${to.getFullYear()}/${to.getMonth()}/${to.getDate()}`

      const date = subset == 'day' ? `${from}` : `${from} - ${to}`
      return {
        title: `${date}`,
        subtitle: id,
        media:
          <span style={{
            alignItems: 'center',
            backgroundColor: 'rgb(234, 234, 234)',
            borderRadius: '4px',
            display: 'flex',
            fontWeight: '600',
            justifyContent: 'center',
            height: '30px',
            width: '30px'
          }}>
            {subset == '30-days' ?
              subset.slice(0,2) : subset.charAt(0).toUpperCase()
            }
          </span>
      }
    }
  }
}

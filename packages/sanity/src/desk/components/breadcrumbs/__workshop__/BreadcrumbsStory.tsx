import {Box, Card, Text} from '@sanity/ui'
import {ChevronRightIcon} from '@sanity/icons'
import React from 'react'
import {Breadcrumbs, BreadcrumbItem} from '../'

const items = [
  {title: 'Root', path: '/'},
  {title: 'Content', path: '/content'},
  {title: 'Posts', path: '/content/posts'},
  {title: 'Featured posts about cats', path: '/content/posts/featured-cats'},
  {
    title:
      'A blog post about cats and very long blog post title that cannot fit in the content space available',
    path: '/content/posts/featured-cats/blog-post',
  },
]

export default function BreadcrumbsStory() {
  return (
    <Box padding={8}>
      <Card padding={2} border>
        <Breadcrumbs
          maxLength={3}
          separator={
            <Text muted>
              <ChevronRightIcon />
            </Text>
          }
        >
          {items.map((item, itemIndex) => (
            <BreadcrumbItem
              lastItem={itemIndex === items.length - 1}
              textOverflow="ellipsis"
              weight="medium"
              key={itemIndex}
            >
              {item.title}
            </BreadcrumbItem>
          ))}
        </Breadcrumbs>
      </Card>
    </Box>
  )
}

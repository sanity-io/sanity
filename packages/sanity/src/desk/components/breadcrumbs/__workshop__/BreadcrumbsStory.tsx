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
    <div style={{padding: '1rem'}}>
      <Breadcrumbs maxLength={3}>
        {items.map((item, itemIndex) => (
          <BreadcrumbItem isTitle={itemIndex === items.length - 1} key={itemIndex}>
            {item.title}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>
    </div>
  )
}

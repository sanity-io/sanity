import {type Author, type Category} from './sanity.types'

export const author: Omit<Author, '_createdAt' | '_updatedAt' | '_rev'> = {
  _id: 'reference-author',
  _type: 'author',
  name: 'Sarah Mitchell',
  bio: [
    {
      _key: 'c4a812b3f609',
      _type: 'block',
      children: [
        {
          _key: 'a9f3d67b8c12',
          _type: 'span',
          text: 'Sarah Mitchell is a seasoned writer and remote work advocate with over a decade of experience in digital communication and workplace wellness. With a passion for helping individuals and businesses thrive in the modern work environment, Sarah has written extensively on topics related to work-life balance, productivity, and mental health. When she’s not writing, Sarah enjoys practicing yoga, exploring the great outdoors, and experimenting with new recipes in her home kitchen. She believes that the key to a fulfilling career is finding harmony between work and life, and she’s dedicated to sharing practical strategies to help others achieve that balance.',
        },
      ],
    },
  ],
}
export const categories: Omit<Category, '_createdAt' | '_updatedAt' | '_rev'>[] = [
  {
    _id: 'category-0',
    _type: 'category',
    name: 'Future of Work',
  },
  {
    _id: 'category-1',
    _type: 'category',
    name: 'Mental Health',
  },
]

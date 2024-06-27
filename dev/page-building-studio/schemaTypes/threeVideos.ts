import {MdVideoFile} from 'react-icons/md'
import {defineField, defineType} from 'sanity'

export const threeVideos = defineType({
  type: 'object',
  icon: MdVideoFile,
  name: 'threeVideos',
  title: 'Three Videos',
  fields: [defineField({type: 'string', name: 'foo'})],
})

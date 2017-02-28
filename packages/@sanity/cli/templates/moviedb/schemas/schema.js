import createSchema from 'part:@sanity/base/schema-creator'
import movie from './movie'
import crewMember from './crewMember'
import castMember from './castMember'
import person from './person'
import screening from './screening'

export default createSchema({
  name: 'default',
  types: [movie, castMember, crewMember, person, screening]
})

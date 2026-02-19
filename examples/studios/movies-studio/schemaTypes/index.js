import blockContent from './blockContent'
import castMember from './castMember'
import crewMember from './crewMember'
import movie from './movie'
import person from './person'
import plotSummaries from './plotSummaries'
import plotSummary from './plotSummary'
import screening from './screening'

export const schemaTypes = [
  // Document types
  movie,
  person,
  screening,

  // Other types
  blockContent,
  plotSummary,
  plotSummaries,
  castMember,
  crewMember,
]

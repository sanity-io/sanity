import category from './category';
import combination from './combination';
import contributionType from './contributionType';
import framework from './framework';
import integration from './integration';
import language from './language';
import solution from './solution';

const allTaxonomies = [
  framework,
  language,
  integration,
  solution,
  contributionType,
  combination,
  category,
];

export default allTaxonomies;

const NON_TAGABLE = ['taxonomy.combination', 'taxonomy.contributionType'];

export const taxonomiesReferenceField = {
  type: 'reference',
  title: 'Reference to a tag',
  to: allTaxonomies
    .filter((type) => !NON_TAGABLE.includes(type.name))
    .map((type) => ({type: type.name})),
};

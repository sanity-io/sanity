// This is a copy and paste from the Sanity.io website repository.
// @TODO: consider abstracting these functions into a package

/**
 * Path structure definition:
 * /plugins, /guides, /showcase & /starters are for respective contributionTypes
 *
 * Every other taxonomy combination follows the /community/[...slug] pattern below:
 * /community/[taxonomyType1]=[taxonomyDoc1Slug]&[taxonomyDoc2Slug]/[taxonomyType2]=...
 *
 * Example:
 * /community/type=guide&showcaseItem/integration=gatsby&shopify/solution=marketing-website
 */

// As we don't have communityTypes in this repository, we're setting these types inline
// import { SanitySlug, TaxonomyPath, TaxonomyTypesT } from "./communityTypes"
type SanitySlug = any;
type TaxonomyPath = any;
type TaxonomyTypesT = any;

const CommunityTaxonomyTypes: TaxonomyTypesT[] = [
  'taxonomy.contributionType',
  'taxonomy.framework',
  'taxonomy.integration',
  'taxonomy.integrationType',
  'taxonomy.solution',
  'taxonomy.language',
  'taxonomy.category',
];

// The order is relevant here, it'll determine the order of the slug paths
const TAXONOMY_URL_MAPPING: {name: TaxonomyTypesT; title: string}[] = [
  {name: 'taxonomy.contributionType', title: 'type'},
  {name: 'taxonomy.framework', title: 'framework'},
  {name: 'taxonomy.category', title: 'cat'},
  {name: 'taxonomy.integration', title: 'integration'},
  {name: 'taxonomy.integrationType', title: 'intType'},
  {name: 'taxonomy.solution', title: 'solution'},
  {name: 'taxonomy.language', title: 'lang'},
];

const CONTRIBUTION_TYPE_PATHS: {[path: string]: string} = {
  '/plugins': 'plugin',
  '/guides': 'guide',
  '/starters': 'starter',
  '/showcase': 'showcaseItem',
};

const BASE_COMMUNITY_PATH = '/community';
const COMMUNITY_HOME_PATH = BASE_COMMUNITY_PATH + '/home';

/**
 * Function that gets the current pathname and figures out what taxonomies are applied to the current community view.
 */
export const parseCommunitySlug = (path: string): TaxonomyPath[] => {
  if (typeof path !== 'string') {
    return [];
  }
  //  If a type path, return that as the single taxonomy
  const typePath = CONTRIBUTION_TYPE_PATHS[path];
  if (typePath) {
    return [
      {
        _type: 'taxonomy.contributionType',
        slug: {current: typePath},
      },
    ];
  }

  const taxonomies = path
    .split('/')
    .map((pathSegment): TaxonomyPath[] => {
      if (!pathSegment) {
        return [];
      }
      // pathSegment: "type=guide&showcaseItem"
      const [typeTitle, selectedPath] = pathSegment.split('=');
      // from "type" to "contributionType", "lang" to "language", etc.
      const taxonomyType = TAXONOMY_URL_MAPPING.find((type) => type.title === typeTitle)?.name;

      if (!taxonomyType || !CommunityTaxonomyTypes.includes(taxonomyType)) {
        return [];
      }

      // selectedPath: "integration=gatsby&shopify", where "gatsby" and "shopify" are slugs of different taxonomy documents of type taxonomy.integration
      const selectedOptions = selectedPath.split('&');
      return selectedOptions.map(
        (option): TaxonomyPath => ({
          _type: taxonomyType,
          slug: {
            current: option,
          },
        })
      );
    })
    .flat();

  return taxonomies;
};

/**
 * Takes in a selection of taxonomies and returns a slug corresponding to its proper filter
 */
export const getCommunitySlug = (taxonomies: TaxonomyPath[]): string => {
  // If no taxonomy, go to the community home
  if (taxonomies.length === 0) {
    return COMMUNITY_HOME_PATH;
  }

  // If only one taxonomy, check to see if it's a contributionType
  if (taxonomies.length === 1 && taxonomies[0]._type === 'taxonomy.contributionType') {
    const typePath: string | undefined = Object.keys(CONTRIBUTION_TYPE_PATHS).find(
      (path) =>
        // for contributionType, slug.current is actually their corresponding type name (taxonomy.) guide, plugin, etc.
        CONTRIBUTION_TYPE_PATHS[path] === taxonomies[0].slug.current
    );
    // If it is a known contributionType, redirect users to the corresponding path instead
    if (typePath) {
      return typePath;
    }
  }

  // Let's reduce the array into an object organized by taxonomy type
  const taxonomySlugsByType: {
    [type: string]: SanitySlug[];
  } = taxonomies.reduce((typeGroups, taxonomy) => {
    const curType = typeGroups[taxonomy._type] || [];
    // // We need to de-duplicate taxonomies, to do that we need to see if the current slug is already present in the current type
    // const alreadyPresent = curType.find(
    //   (t) => t?.current === taxonomy.slug?.current
    // )
    return {
      ...typeGroups,
      [taxonomy._type]: [...curType, taxonomy.slug],
    };
  }, {});
  // From this object we can start generating the proper path
  // We start from TAXONOMY_TYPE_MAPPING to respect its order
  const path = TAXONOMY_URL_MAPPING.map((type) => {
    const optionsSlugs = taxonomySlugsByType[type.name];
    if (!optionsSlugs) {
      return undefined;
    }
    return `${type.title}=${optionsSlugs.map((slug) => slug.current).join('&')}`;
  })
    .filter((segment) => !!segment)
    .join('/');
  return `${BASE_COMMUNITY_PATH}/${path}`;
};

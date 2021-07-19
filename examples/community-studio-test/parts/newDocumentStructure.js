// This prevents users from creating a new generalSettings or home file from the "Create new document" menu in Sanity
import S from '@sanity/base/structure-builder';

const CREATABLE_TYPES_COMMUNITY = [
  'contribution.guide',
  'contribution.plugin',
  'contribution.showcaseProject',
  'contribution.starter',
  'contribution.tool',
];

const CREATABLE_TYPES_ADMIN = [
  ...CREATABLE_TYPES_COMMUNITY,
  'taxonomy.integration',
  'taxonomy.framework',
  'taxonomy.language',
  'taxonomy.solution',
  'taxonomy.category',
  'taxonomyCombination',
  'studioTutorial',
];

export default [
  ...S.defaultInitialValueTemplateItems().filter(({spec}) => {
    if (window._sanityUser?.role === 'administrator') {
      return CREATABLE_TYPES_ADMIN.includes(spec.templateId);
    }
    return CREATABLE_TYPES_COMMUNITY.includes(spec.templateId);
  }),
];

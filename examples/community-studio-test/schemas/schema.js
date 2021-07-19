// First, we must import the schema creator
import createSchema from 'part:@sanity/base/schema-creator';

// Then import schema types from any plugins that might expose them
import schemaTypes from 'all:part:@sanity/base/schema-type';

import aggregate from './documents/aggregate';
import contribution from './documents/contribution';
import docSearch from './documents/docSearch';
import emojiTracker from './documents/emojiTracker';
import person from './documents/person';
import tagOption from './documents/tagOption';
import ticket from './documents/ticket';
import taxonomies from './documents/taxonomies';

import authors from './objects/authors';
import emojiEntry from './objects/emojiEntry';
import emojiSummary from './objects/emojiSummary';
import message from './objects/message';
import searchEntry from './objects/searchEntry';
import simpleStats from './objects/simpleStats';
import tag from './objects/tag';
import richText from './objects/richText';
import studioImage from './objects/studioImage';
import simpleBlockContent from './objects/simpleBlockContent';
import contributions from './documents/contributions';
import curatedContribution from './documents/contributions/curatedContribution';
import studioTutorials from './documents/studioTutorials';
import guideBody from './objects/guideBody';
import communityBulletin from './documents/communityBulletin';
import schemaEntryObj from './objects/schemaEntryObj';
import youtube from './objects/youtube';
import callout from './objects/callout';

export default createSchema({
  name: 'default',
  types: schemaTypes.concat([
    // Document types
    aggregate,
    contribution,
    docSearch,
    emojiTracker,
    person,
    tagOption,
    ticket,
    studioTutorials,
    communityBulletin,
    ...contributions,
    curatedContribution,
    // Object types
    guideBody,
    authors,
    emojiEntry,
    emojiSummary,
    message,
    searchEntry,
    simpleStats,
    studioImage,
    tag,
    richText,
    simpleBlockContent,
    schemaEntryObj,
    youtube,
    callout,
    ...taxonomies,
  ]),
});

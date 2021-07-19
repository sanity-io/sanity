import React from 'react';
import S from '@sanity/desk-tool/structure-builder';
import client from 'part:@sanity/base/client';

import Icon from '../schemas/components/icon';

export default S.listItem()
  .title('Curated contributions')
  .icon(() => <Icon emoji="👌" />)
  .child(
    S.list()
      .title('Curated contributions')
      .items([
        S.listItem()
          .title('Pending approval')
          .icon(() => <Icon emoji="⏳" />)
          .child(
            S.documentList()
              .schemaType('curatedContribution')
              .title('Pending approval')
              .filter('_type == "curatedContribution" && !defined(approved)')
              .menuItems([])
              // We remove initialValueTemplates to hide the "Create new" action menu from the list
              .initialValueTemplates([])
          ),
        S.listItem()
          .title('Rejected')
          .icon(() => <Icon emoji="❌" />)
          .child(
            S.documentList()
              .schemaType('curatedContribution')
              .title('Rejected')
              .filter('_type == "curatedContribution" && approved == false')
              .menuItems([])
              .initialValueTemplates([])
          ),
        S.listItem()
          .title('Approved')
          .icon(() => <Icon emoji="✅" />)
          .child(
            S.documentList()
              .schemaType('curatedContribution')
              .title('Approved')
              .filter('_type == "curatedContribution" && approved == true')
              .menuItems([])
              .initialValueTemplates([])
          ),
        S.listItem()
          .title('Featured')
          .icon(() => <Icon emoji="✨" />)
          .child(
            S.documentList()
              .schemaType('curatedContribution')
              .title('Featured')
              .filter('_type == "curatedContribution" && featured == true')
              .menuItems([])
              .initialValueTemplates([])
          ),
        S.listItem()
          .title('Curation document not created')
          .icon(() => <Icon emoji="❓" />)
          .child(
            S.documentList()
              .title('Curation document not created')
              .filter(
                '!(_id in path("drafts.**")) && _type match "contribution.**" && count(*[_type == "curatedContribution" && contribution._ref == ^._id]) == 0'
              )
              .menuItems([])
              .initialValueTemplates([])
              .child((_id) =>
                S.document()
                  .schemaType('curatedContribution')
                  .id(`curated.${_id}`)
                  .documentId(`curated.${_id}`)
                  .initialValueTemplate('create-curatedContribution', {contributionId: _id})
              )
          ),
        S.listItem()
          .title('Contribution document inexistent/deleted')
          .icon(() => <Icon emoji="💔" />)
          .child(
            S.documentList()
              .title('Contribution document inexistent/deleted')
              .schemaType('curatedContribution')
              .filter(
                '!(_id in path("drafts.**")) && _type == "curatedContribution" && !defined(contribution->)'
              )
              .menuItems([])
              .initialValueTemplates([])
          ),
        S.divider(),
        S.documentTypeListItem('curatedContribution').title('All'),
      ])
  );

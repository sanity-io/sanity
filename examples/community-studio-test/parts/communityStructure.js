import React from 'react';
import {EyeOpenIcon, HelpCircleIcon, PackageIcon} from '@sanity/icons';
import PlusIcon from 'part:@sanity/base/plus-icon';
import S from '@sanity/desk-tool/structure-builder';
import client from 'part:@sanity/base/client';
import Spinner from 'part:@sanity/components/loading/spinner';
import {useRouter} from 'part:@sanity/base/router';

import Icon from '../schemas/components/icon';
import {CONTRIBUTION_TYPES} from './adminStructure';
import resolveProductionUrl from './resolveProductionUrl';
import Tutorial from '../schemas/components/tutorial/Tutorial';

/**
 * Gets a personalized document list for the currently logged user
 */
function getDocumentListItem(type) {
  const defaultListItem = S.documentTypeListItem(type);
  const defaultDocList = S.documentTypeList(type);
  return S.listItem()
    .id(type)
    .schemaType(type)
    .title(defaultListItem.getTitle())
    .icon(defaultListItem.getIcon())
    .child(
      S.documentList()
        .id(type)
        .schemaType(type)
        .title(defaultListItem.getTitle())
        .filter('_type == $type && $userId in authors[]._ref')
        .params({userId: window._sanityUser?.id, type})
        .menuItems([
          {
            title: 'Create new',
            icon: PlusIcon,
            intent: {
              type: 'create',
              params: {
                type: type,
                template: type,
              },
            },
            showAsAction: true,
          },
          ...defaultDocList.getMenuItems(),
        ])
    );
}

/**
 * This is a function instead of a plain array to make sure we get the freshest window._sanityUser
 */
export const getCommunityStructure = () => [
  ...CONTRIBUTION_TYPES.map((type) => getDocumentListItem(type)),
  S.divider(),
  S.listItem()
    .title('All your contributions')
    .icon(PackageIcon)
    .id('all')
    .child(
      S.documentList()
        .id('all')
        .title('All your contributions')
        .filter('_type match "contribution.**" && $userId in authors[]._ref')
        .params({userId: window._sanityUser?.id})
    ),
  S.documentListItem().schemaType('person').id(window._sanityUser?.id).title('Your profile'),
  S.listItem()
    .title('See your profile live')
    .icon(EyeOpenIcon)
    .child(
      S.component()
        .id('profile-preview')
        .component(() => {
          // Simple component to open the contributor's profile on another tab
          const [status, setStatus] = React.useState({state: 'loading'});
          const router = useRouter();

          async function fetchContributor() {
            const person = await client.fetch('*[_type == "person" && _id == $id][0]', {
              id: window._sanityUser?.id,
            });
            setStatus({state: 'idle', person});
          }

          React.useEffect(() => {
            setStatus({state: 'loading'});
            fetchContributor();
          }, []);

          React.useEffect(() => {
            if (status.person?.handle?.current) {
              const url = resolveProductionUrl(status.person);

              // Open their profile in the Sanity site
              window.open(url, '_blank');
              // And go back to the person's profile
              router.navigateIntent('edit', {id: window._sanityUser?.id});
            }
          }, [status.person]);

          if (status.state === 'loading' || status.person?.handle?.current) {
            return (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '30px',
                }}
              >
                <Spinner />
              </div>
            );
          }

          // @TODO: improve error handling with an IntentLink to edit their profile
          return (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <h1 style={{margin: 0}}>Your profile isn't published yet</h1>
              <p>You can do so by clicking on it in the sidebar :)</p>
            </div>
          );
        })
    ),
  S.divider(),
  S.listItem()
    .id('help')
    .icon(HelpCircleIcon)
    .title('Help')
    .child(
      S.documentList()
        .id('tutorials')
        .title('Tutorials')
        .filter(
          /* groq */ `_type == "contribution.guide" && _id in *[_id == "studioTutorials"][0].chosenGuides[]._ref`
        )
        .child((docId) =>
          S.component()
            .id(docId)
            .component(() => <Tutorial docId={docId} />)
        )
    ),
];

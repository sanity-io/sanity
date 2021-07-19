import React, {useState, useEffect} from 'react';
import speakingurl from 'speakingurl';
import PublishIcon from 'part:@sanity/base/publish-icon';
import Snackbar from 'part:@sanity/components/snackbar/item?';
import {useDocumentOperation, useValidationStatus} from '@sanity/react-hooks';

export const createCuratedContribution = async ({type, id}) => {
  const res = await fetch(
    `/api/curate-contribution?docId=${id.replace('drafts.', '')}&contributionType=${type}`
  );
  return res.status === 200;
};

export default function PublishContributionAction(props) {
  const {patch, publish} = useDocumentOperation(props.id, props.type);
  const {isValidating, markers} = useValidationStatus(props.id, props.type);
  const [status, setStatus] = useState('idle'); // idle, loading,
  // See https://github.com/sanity-io/sanity/issues/1932 to understand the need for this
  const [canPublish, allowPublish] = useState(false);

  useEffect(() => {
    // If the document has no changes or is already published, the publish operation will be disabled
    if (publish.disabled) {
      allowPublish(false);
      return;
    }
    // Otherwise, it might be the case that the document isn't valid, so we must check validity
    if (!isValidating) {
      // If there are no validation markers, the document is perfect and good for publishing
      if (markers.length === 0) {
        allowPublish(true);
      } else {
        allowPublish(false);
      }
    }
  }, [publish.disabled, isValidating]);

  useEffect(() => {
    // if the status was loading and the draft has changed
    // to become `null` the document has been published
    if (status === 'loading' && !props.draft) {
      // Signal that the action is completed
      props.onComplete();
    }
  }, [props.draft]);

  function dismissError() {
    setStatus('idle');
    props.onComplete();
  }

  async function onHandle() {
    // This will update the button text
    setStatus('loading');

    const document = props.draft || props.published;

    // Schemas' slugs are auto-generated and hidden from users
    if (props.type === 'contribution.schema' && !document.slug?.current) {
      const slugFriendlyId = props.id.replace('drafts.', '').split('-')[0];
      const slugFriendlyTitle = speakingurl(document.title || document.headline || '', {
        symbols: true,
      });
      patch.execute([
        {
          set: {
            slug: {
              current: `${slugFriendlyTitle}-${slugFriendlyId}`,
            },
          },
        },
      ]);
    }

    if (props.type === 'contribution.tool') {
      const readmeUrl = (props.draft || props.published || {}).readmeUrl;
      if (!readmeUrl) {
        setStatus('error');
        return
      }
      try {
        const res = await fetch(`/api/fetch-plugin-readme?readmeUrl=${readmeUrl}`);
        const {file} = await res.json();

        if (typeof file === 'string') {
          // Set the readme file
          patch.execute([{set: {readme: file}}]);
        } else {
          // When erroing out, props.onComplete will be called by the popover or Snackbar above ;)
          setStatus('error');
        }
      } catch (error) {
        setStatus('error');
      }
    }

    const createdCuratedDoc = await createCuratedContribution({type: props.type, id: props.id});

    // @TODO: better error handling
    if (createdCuratedDoc) {
      // Perform the publish, the effect above will deal with it when its done
      publish.execute();
    } else {
      setStatus('error');
    }
  }

  const disabled = !canPublish || publish.disabled || status === 'loading' || status === 'error';
  return {
    disabled,
    label: status === 'loading' ? 'Publishing…' : 'Publish',
    icon: PublishIcon,
    shortcut: disabled ? null : 'Ctrl+Alt+P',
    // This is a hacky way to show a Snackbar notification in case the action failed
    // @TODO: make this palatable to end users
    dialog: status === 'error' && {
      type: 'popover',
      onClose: dismissError,
      content: (
        <div style={{position: 'absolute'}}>
          <Snackbar
            offset={70}
            isOpen={true}
            id={`failed-to-publish-contribution`}
            setFocus={false}
            onClose={dismissError}
            onDismiss={dismissError}
            kind={'error'}
            title={'Something went wrong'}
            subtitle={'Please try again'}
            // title={"We couldn't get a README from the provided URL"}
            // subtitle={
            //   "Open it in a new tab and make sure it's rendering a raw text or markdown file, then try again. If this problem persists, get in touch with the Sanity team."
            // }
            isCloseable={true}
            onSetHeight={() => {
              // noop
            }}
          ></Snackbar>
        </div>
      ),
    },
    onHandle,
  };
}

import {useState, useEffect} from 'react';
import speakingurl from 'speakingurl';
import PublishIcon from 'part:@sanity/base/publish-icon';
import {useDocumentOperation, useValidationStatus} from '@sanity/react-hooks';

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

  async function onHandle() {
    // This will update the button text
    setStatus('loading');

    // Auto-generate a slug if not set yet
    const document = props.draft || props.published;
    if (!document.slug?.current) {
      const [lastPermalinkPath] = document.permalink.split('/').slice(-1);
      const slugFriendlyId = lastPermalinkPath.split('?')[0];
      const textForSlug =
        document.editorialTitle || document.summary || document.thread[0]?.content || '';
      // @TODO: better way to slice this portion of the URL
      const slugFriendlyTitle = speakingurl(textForSlug, {
        symbols: true,
      }).slice(0, 30);
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

    publish.execute();
  }

  const disabled = !canPublish || publish.disabled || status === 'loading' || status === 'error';
  return {
    disabled,
    label: status === 'loading' ? 'Publishing…' : 'Publish',
    icon: PublishIcon,
    shortcut: disabled ? null : 'Ctrl+Alt+P',
    onHandle,
  };
}

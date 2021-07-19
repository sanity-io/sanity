import React from 'react';

import resolveProductionUrl from '../../parts/resolveProductionUrl';
import styles from './Preview.module.css';
import SanityMobilePreview from 'sanity-mobile-preview';
import 'sanity-mobile-preview/dist/index.css?raw';

const useTemporaryRedirect = (url) => {
  const [hasOpened, setOpened] = React.useState(false);
  React.useEffect(() => {
    if (url && !hasOpened) {
      // Open the contribution in a new window while we sort out CORS issues for iframing
      window.open(url, '_blank');
      setOpened(true);
    }
  }, [url]);
  return {};
};

const ErrorDisplay = () => {
  return (
    <div className={styles.errorContainer}>
      <p>Fill all the required fields before accessing the preview</p>
    </div>
  );
};

const Preview = ({document, isMobile}) => {
  const displayed = document?.displayed || {};
  const url = resolveProductionUrl(displayed);

  if (!url) {
    return <ErrorDisplay />;
  }

  return (
    <div className={styles.iframeContainer}>
      {isMobile ? (
        <SanityMobilePreview>
          <div className={styles.iframeContainer}>
            <iframe src={url} frameBorder={'0'} />
          </div>
        </SanityMobilePreview>
      ) : (
        <iframe src={url} frameBorder={'0'} />
      )}
    </div>
  );
};

export const WebPreview = ({document}) => {
  return <Preview document={document} />;
};

export const MobilePreview = ({document}) => {
  return <Preview document={document} isMobile={true} />;
};

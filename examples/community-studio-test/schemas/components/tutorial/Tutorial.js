import React from 'react';
import client from 'part:@sanity/base/client';
import Spinner from 'part:@sanity/components/loading/spinner';

const Tutorial = ({docId}) => {
  // Simple component to open the contributor's profile on another tab
  const [status, setStatus] = React.useState({state: 'loading'});

  async function fetchTutorial() {
    const tutorial = await client.fetch('*[_type == "contribution.guide" && _id == $id][0]', {
      id: docId,
    });
    setStatus({state: 'idle', tutorial});
  }

  React.useEffect(() => {
    fetchTutorial();
  }, []);

  if (status.state === 'loading' || !status.tutorial?.slug?.current) {
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

  return (
    <iframe
      style={{
        height: '100%',
        width: '100%',
        border: '0',
      }}
      src={`https://www.sanity.io/guides/${status.tutorial.slug.current}`}
      frameBorder={'0'}
    />
  );
};

export default Tutorial;

import React from 'react';
import {PortableText} from '@portabletext/react';
import {Flex} from '@sanity/ui';
import PropTypes from "prop-types";
import {urlFor} from "../../helpers/image-url-builder";

const textComponents = {
  types: {
    image: ({value}) =>
      value?.asset ? (
        <Flex flex={1} justify="center">
          <img src={urlFor(value).url()}  alt="" style={{maxWidth: '100%'}}/>
        </Flex>
      ) : null,
  }
}

export function BlockText(props) {
    const {value} = props

    if (!value) {
        return null;
    }
    return <PortableText value={value} components={textComponents}/>;
}


BlockText.propTypes = {
    value: PropTypes.object
};

import groq from 'groq'

import {fragment1} from './importSeq2'

export const query = groq`*[_type == "${fragment1}"]`

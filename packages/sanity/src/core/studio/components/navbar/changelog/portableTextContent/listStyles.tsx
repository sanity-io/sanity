import {css} from 'styled-components'

export const listStyles = css`
  --margin-top: ${({theme}) => theme.sanity.space[1]}px;

  &:not([data-list-type='number']) {
    counter-reset: section;
  }

  &[data-list-type='bullet'] {
    --bullet-marker: '●';
    margin-top: var(--margin-top);

    [data-list-type='bullet'] {
      --bullet-marker: '○';
      margin-top: var(--margin-top);

      [data-list-type='bullet'] {
        --bullet-marker: '■';
        margin-top: var(--margin-top);

        [data-list-type='bullet'] {
          --bullet-marker: '●';
          margin-top: var(--margin-top);

          [data-list-type='bullet'] {
            --bullet-marker: '○';
            margin-top: var(--margin-top);

            [data-list-type='bullet'] {
              --bullet-marker: '■';
              margin-top: var(--margin-top);

              [data-list-type='bullet'] {
                --bullet-marker: '●';
                margin-top: var(--margin-top);

                [data-list-type='bullet'] {
                  --bullet-marker: '○';
                  margin-top: var(--margin-top);

                  [data-list-type='bullet'] {
                    --bullet-marker: '■';
                    margin-top: var(--margin-top);

                    [data-list-type='bullet'] {
                      --bullet-marker: '●';
                      margin-top: var(--margin-top);

                      [data-list-type='bullet'] {
                        --bullet-marker: '○';
                        margin-top: var(--margin-top);

                        [data-list-type='bullet'] {
                          --bullet-marker: '■';
                          margin-top: var(--margin-top);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  &[data-list-type='number'] {
    --bullet-marker: counter(section, number) '. ';
    counter-reset: section;
    margin-top: var(--margin-top);

    [data-list-type='number'] {
      --bullet-marker: counter(section, lower-alpha) '. ';
      counter-reset: section;
      margin-top: var(--margin-top);

      [data-list-type='number'] {
        --bullet-marker: counter(section, lower-roman) '. ';
        counter-reset: section;
        margin-top: var(--margin-top);

        [data-list-type='number'] {
          --bullet-marker: counter(section, number) '. ';
          counter-reset: section;
          margin-top: var(--margin-top);

          [data-list-type='number'] {
            --bullet-marker: counter(section, lower-alpha) '. ';
            counter-reset: section;
            margin-top: var(--margin-top);

            [data-list-type='number'] {
              --bullet-marker: counter(section, lower-roman) '. ';
              counter-reset: section;
              margin-top: var(--margin-top);

              [data-list-type='number'] {
                --bullet-marker: counter(section, number) '. ';
                counter-reset: section;
                margin-top: var(--margin-top);

                [data-list-type='number'] {
                  --bullet-marker: counter(section, lower-alpha) '. ';
                  counter-reset: section;
                  margin-top: var(--margin-top);

                  [data-list-type='number'] {
                    --bullet-marker: counter(section, lower-roman) '. ';
                    counter-reset: section;
                    margin-top: var(--margin-top);

                    [data-list-type='number'] {
                      --bullet-marker: counter(section, number) '. ';
                      counter-reset: section;
                      margin-top: var(--margin-top);

                      [data-list-type='number'] {
                        --bullet-marker: counter(section, lower-alpha) '. ';
                        counter-reset: section;
                        margin-top: var(--margin-top);

                        [data-list-type='number'] {
                          --bullet-marker: counter(section, lower-roman) '. ';
                          counter-reset: section;
                          margin-top: var(--margin-top);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

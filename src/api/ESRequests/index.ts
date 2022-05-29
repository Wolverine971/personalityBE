export const mustContain = (index: string, text: string) => {
  if (text) {
    return {
      index,
      body: {
        query: {
          bool: {
            must: {
              query_string: {
                query: text,
                fuzziness: 'AUTO'
              },
            },
          },
        },
      },
    };
  } else {
    return {
      index,
    };
  }
};

// https://www.elastic.co/guide/en/elasticsearch/reference/6.8/full-text-queries.html

export const typeaheadQuery = (index: string, text: string) => {
  return {
    index,
    body: {
      query: {
        match_phrase_prefix: {
          question: text,
        },
      },
      fuzziness: 'AUTO'
    },
  };
};

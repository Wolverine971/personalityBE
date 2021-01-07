// tslint:disable-next-line: no-var-requires
const rp = require("request-promise");

export const pingGraphql = async (query: any, variables?: any) => {
  try {
    const options = {
      method: "POST",
      uri: "http://localhost:3002/graphql",
      body: {
        variables,
        query,
      },
      json: true,
    };

    return rp(options).then((r) => {
      return r;
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

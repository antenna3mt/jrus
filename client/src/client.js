import axios from 'axios';
import { RpcRequest, JsonRpcVersion, ServerError, JrusError } from 'jrus-share';

export class JrusClient {
  constructor(url) {
    this.url = url;
  }

  get services() {
    const { url } = this;
    return new Proxy({}, {
      get(_, service) {
        if (service === 'inspect') return null;
        if (typeof service === 'symbol') return null;
        return new Proxy({}, {
          get(__, action) {
            if (action === 'inspect') return null;
            if (typeof action === 'symbol') return null;
            return async (...params) => {
              let req;
              let res;
              try {
                req = new RpcRequest({
                  params,
                  jsonrpc: JsonRpcVersion,
                  method: `${service}.${action}`,
                  id: null,
                });

                res = await axios({
                  method: 'post',
                  url,
                  data: req,
                }).then(r => r.data);
              } catch (e) {
                throw new Error('network');
              }

              const { result, error } = res;
              if (error) {
                const { code, data } = error || {};
                if (code === ServerError.code) {
                  throw new JrusError(data);
                } else {
                  throw new JrusError(error);
                }
              } else {
                return result;
              }
            };
          },
        });
      },
    });
  }
}

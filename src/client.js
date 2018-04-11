import axios from 'axios';
import is from 'is_js';
import { RpcRequest, JsonRpcVersion, ServerError, JrusError, NetworkConnectError, UnknownError } from '.';

export class JrusClient {
  constructor(url) {
    this.url = url;
    this.headers = {};
  }

  setHeader(key, value) {
    this.headers[key] = value;
  }

  get services() {
    const { url, headers } = this;
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
              } catch (e) {
                throw new JrusError(e);
              }

              try {
                res = await axios({
                  headers,
                  method: 'post',
                  url,
                  data: req,
                }).then(r => r.data);
              } catch (e) {
                throw new JrusError(NetworkConnectError);
              }

              const { result, error } = res;
              if (is.existy(error) && is.object(error)) {
                const { code, data } = error;
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

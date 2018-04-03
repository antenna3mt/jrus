/**
 * Totally free structure Error. Used to for json stringify.
 */
export class JrusError {
  constructor(obj) {
    Object.assign(this, obj);
  }
}


export const ParseError = { code: -32700, message: 'Parse error' };
export const InvalidRequestError = { code: -32600, message: 'Invalid Request' };
export const MethodNotFoundError = { code: -32601, message: 'Method not found' };
export const InvalidParamsError = { code: -32602, message: 'Invalid params' };
export const InternalError = { code: -32603, message: 'Internal error' };
export const ServerError = { code: -32000, message: 'Server error' };
export const NetworkConnectError = { code: -32001, message: 'network connect error' };
export const UnknownError = { code: -32002, message: 'unknown error' };

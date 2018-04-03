// jsonrpc 2.0
import is from 'is_js';
import { ServerError, InvalidRequestError, InvalidParamsError, MethodNotFoundError, ParseError } from '.';

export const JsonRpcVersion = '2.0';


/**
 * Rpc Error Object Specification (http://www.jsonrpc.org/specification)
 *
 * When a rpc call encounters an error, the Response Object MUST contain the error member with a value that is a Object with the following members:
 *
 * code: A Number that indicates the error type that occurred. This MUST be an integer.
 * message: A String providing a short description of the error. The message SHOULD be limited to a concise single sentence.
 * data: A Primitive or Structured value that contains additional information about the error. This may be omitted. The value of this member is defined by the Server (e.g. detailed error information, nested errors etc.).
 *
 * The error codes from and including -32768 to -32000 are reserved for pre-defined errors.
 */
export class RpcError {
  // When the object is of structure {message, code, data}, wrap it and return;
  // otherwise, wrap the object to data and return a general error type
  constructor(obj) {
    if (RpcError.isGeneric(obj)) {
      const { message, code, data } = obj;
      Object.assign(this, { message, code, data });
    } else {
      this.code = ServerError.code;
      this.message = ServerError.message;
      this.data = obj;
    }
  }

  // obj is object && code is integer && message is string
  static isGeneric(obj) {
    if (is.not.object(obj)) return false;
    const { message, code } = obj;
    if (is.not.integer(code)) return false;
    if (is.not.string(message)) return false;
    return true;
  }

  toString() {
    return `[${this.code}] ${this.message} ${this.data || ''}`;
  }
}

/**
 *
 * Rpc Request Specification (http://www.jsonrpc.org/specification)
 * A rpc call is represented by sending a Request object to a Server. The Request object has the following members:
 * jsonrpc: A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0".
 * method: A String containing the name of the method to be invoked. Method names that begin with the word rpc followed by a period character (U+002E or ASCII 46) are reserved for rpc-internal methods and extensions and MUST NOT be used for anything else.
 * params: A Structured value that holds the parameter values to be used during the invocation of the method. This member MAY be omitted.
 * id: An identifier established by the Client that MUST contain a String, Number, or NULL value if included. If it is not included it is assumed to be a notification. The value SHOULD normally not be Null and Numbers SHOULD NOT contain fractional parts
 */
export class RpcRequest {
  constructor(obj) {
    if (is.not.object(obj)) throw InvalidRequestError;

    const {
      jsonrpc, method, params, id,
    } = obj;

    // jsonrpc: string & =2.0
    if (jsonrpc === JsonRpcVersion) {
      this.jsonrpc = jsonrpc;
    } else {
      throw InvalidRequestError;
    }

    // method: !undefined & string
    if (is.string(method)) {
      this.method = method;
    } else {
      throw InvalidRequestError;
    }

    // id: undefined | null | string | number(integer)
    if (is.not.existy(id) || is.string(id) || is.integer(id)) {
      this.id = id;
    } else {
      throw InvalidRequestError;
    }

    // params: undefined | object
    if (is.not.existy(params) || is.object(params)) {
      this.params = params;
    } else {
      throw InvalidParamsError;
    }
  }

  isNotification() {
    return this.id === undefined;
  }
}

/**
 *
 * Rpc Request Object Specification (http://www.jsonrpc.org/specification)
 * When a rpc call is made, the Server MUST reply with a Response, except for in the case of Notifications. The Response is expressed as a single JSON Object, with the following members:
 *
 * jsonrpc: A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0".
 * result: This member is REQUIRED on success. This member MUST NOT exist if there was an error invoking the method. The value of this member is determined by the method invoked on the Server.
 * error: This member is REQUIRED on error. This member MUST NOT exist if there was no error triggered during invocation. The value for this member MUST be an Object as defined in section 5.1.
 * id: This member is REQUIRED. It MUST be the same as the value of the id member in the Request Object.
 *  If there was an error in detecting the id in the Request object (e.g. Parse error/Invalid Request), it MUST be Null.Either the result member or error member MUST be included, but both members MUST NOT be included.
 *
 */

// for Success
export class RpcSuccessResponse {
  constructor(result, jsonrpc = JsonRpcVersion, id = null) {
    this.jsonrpc = jsonrpc;
    this.result = result;
    this.id = id;
  }
}

// for Error
export class RpcErrorResponse {
  constructor(err, jsonrpc = JsonRpcVersion, id = null) {
    this.jsonrpc = jsonrpc;
    this.error = new RpcError(err);
    this.id = id;
  }
}

/**
 * Rpc runner
 */
export class RpcRunner {
  constructor(methodSelector) {
    this.methodSelector = methodSelector;
  }

  // exec the action with method and params; return the result from method calling.
  async runCore(method, params) {
    const callable = await this.methodSelector(method);
    if (is.not.function(callable)) throw MethodNotFoundError;
    return is.array(params) ? callable(...params) : callable({ ...params });
  }

  // exec the action with request object; return the response object;
  async runRequest(req) {
    const {
      jsonrpc, id, method, params,
    } = req;
    try {
      const result = await this.runCore(method, params);
      if (req.isNotification() !== true) return new RpcSuccessResponse(result, jsonrpc, id);
    } catch (e) {
      return new RpcErrorResponse(e, jsonrpc, id);
    }
  }

  // exec single request
  async singleRun(obj) {
    let req;
    try {
      req = new RpcRequest(obj);
    } catch (e) {
      return new RpcErrorResponse(e);
    }
    const res = await this.runRequest(req);
    if (!req.isNotification()) return res;
  }

  // exec batch requests
  async batchRun(objs) {
    if (is.empty(objs)) return new RpcErrorResponse(InvalidRequestError);
    const all = [];
    for (let i = 0; i < objs.length; i += 1) {
      const res = await this.singleRun(objs[i]);
      if (is.existy(res)) all.push(res);
    }
    if (is.not.empty(all)) return all;
  }

  // the simplest entrance for exec
  async run(obj) {
    if (is.not.existy(obj)) return new RpcErrorResponse(ParseError);
    return is.array(obj) ? this.batchRun(obj) : this.singleRun(obj);
  }
}

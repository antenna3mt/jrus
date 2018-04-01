// jsonrpc 2.0

export const JsonRpcVersion = '2.0';
export const ParseError = { code: -32700, message: 'Parse error' };
export const InvalidRequestError = { code: -32600, message: 'Invalid Request' };
export const MethodNotFoundError = { code: -32601, message: 'Method not found' };
export const InvalidParamsError = { code: -32602, message: 'Invalid params' };
export const InternalError = { code: -32603, message: 'Internal error' };
export const ServerError = { code: -32000, message: 'Server error' };


export class RpcError {
  constructor(obj) {
    if (RpcError.isGeneric(obj)) {
      const { message, code, data } = obj;
      this.code = code;
      this.message = message;
      this.data = data;
    } else {
      this.code = ServerError.code;
      this.message = (typeof obj === 'object' && typeof obj.toString === 'function') ? obj.toString() : ServerError.message;
      this.data = obj;
    }
  }

  static isGeneric(obj) {
    if (typeof obj !== 'object') return false;
    const { message, code } = obj;
    if (!(typeof code === 'number' && Number.isInteger(code))) return false;
    if (!(typeof message === 'string')) return false;
    return true;
  }

  toString() {
    return `[${this.code}] ${this.message} ${this.data || ''}`;
  }
}


export class RpcRequest {
  constructor(obj) {
    if (obj === undefined) throw ParseError;
    // prevent object destructung error
    if (typeof obj !== 'object') throw InvalidRequestError;

    const {
      jsonrpc, method, params, id,
    } = obj;

    // jsonrpc: string & =2.0
    if (typeof method === 'string' && jsonrpc === JsonRpcVersion) {
      this.jsonrpc = jsonrpc;
    } else {
      throw InvalidRequestError;
    }

    // method: !undefined & string
    if (method !== undefined && typeof method === 'string') {
      this.method = method;
    } else {
      throw InvalidRequestError;
    }

    // id: undefined | null | string | number(integer)
    if (id === undefined || id === null || typeof id === 'string' || (typeof id === 'number' && Number.isInteger(id))) {
      this.id = id;
    } else {
      throw InvalidRequestError;
    }

    // params: undefined | object
    if (params === undefined || typeof params === 'object') {
      this.params = params;
    } else {
      throw InvalidParamsError;
    }
  }

  isNotification() {
    return this.id === undefined;
  }
}


export class RpcSuccessResponse {
  constructor(result, jsonrpc = JsonRpcVersion, id = null) {
    this.jsonrpc = jsonrpc;
    this.result = result;
    this.id = id;
  }
}

export class RpcErrorResponse {
  constructor(err, jsonrpc = JsonRpcVersion, id = null) {
    this.jsonrpc = jsonrpc;
    this.error = new RpcError(err);
    this.id = id;
  }
}

export class RpcRunner {
  constructor(methodSelector) {
    this.methodSelector = methodSelector;
  }

  async coreRun(method, params) {
    const callable = await this.methodSelector(method);
    if (typeof callable !== 'function') throw MethodNotFoundError;
    return Array.isArray(params) ? callable(...params) : callable({ ...params });
  }

  async thinRun(req) {
    const { method, params } = req;
    return this.coreRun(method, params);
  }

  async singleRun(obj) {
    let jsonrpc;
    let id;
    try {
      const req = new RpcRequest(obj);
      ({ jsonrpc, id } = req);
      const result = await this.thinRun(req);
      if (!req.isNotification()) return new RpcSuccessResponse(result, jsonrpc, id);
      return null;
    } catch (e) {
      return new RpcErrorResponse(e, jsonrpc, id);
    }
  }

  async batchRun(objs) {
    if (objs.length === 0) return new RpcErrorResponse(InvalidRequestError);
    const all = [];
    for (let i = 0; i < objs.length; i += 1) {
      const res = await this.singleRun(objs[i]);
      if (res) all.push(res);
    }
    if (all.length > 0) return all; return null;
  }

  async run(obj) {
    return Array.isArray(obj) ? this.batchRun(obj) : this.singleRun(obj);
  }
}

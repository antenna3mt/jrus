import parser from 'co-body';
import is from 'is_js';
import { MethodNotFoundError, ParseError, InvalidRequestError, RpcRequest, RpcSuccessResponse, RpcErrorResponse, JrusError } from '.';


class RpcRunner {
  constructor(services) {
    this.ctx = {};
    this.services = { ...services };
  }

  context(map) {
    Object.assign(this.ctx, map);
  }

  async getRunnableMethod(method) {
    const { services } = this;
    const [service, action] = method.split('.');
    if (service && action && services[service] && services[service][action]) {
      const beforeRun = (is.function(services[service].before)) ? services[service].before : async () => { };
      const afterRun = (is.function(services[service].after)) ? services[service].after : async () => { };
      return async function runnable(...args) {
        await beforeRun.bind(this)();
        const result = await services[service][action].bind(this)(args);
        await afterRun.bind(this)();
        return result;
      };
    }
    throw MethodNotFoundError;
  }

  async runCore(obj) {
    const req = new RpcRequest(obj);
    const {
      jsonrpc, id, method, params,
    } = req;

    this.context({ rpc: req });
    try {
      const runnable = (await this.getRunnableMethod(method)).bind(this.ctx);
      const result = is.array(params) ? await runnable(...params) : await runnable({ ...params });
      if (req.isNotification() !== true) return new RpcSuccessResponse(result, jsonrpc, id);
    } catch (e) {
      return new RpcErrorResponse(e, jsonrpc, id);
    }
  }

  async run(req) {
    try {
      this.context({ req, services: this.services });
      // parse
      const body = await parser(req).catch(() => { throw new JrusError(ParseError); });

      // batch or singular
      if (is.array(body)) {
        if (is.empty(body)) throw new JrusError(InvalidRequestError);
        const all = [];
        for (let i = 0; i < body.length; i += 1) {
          const res = await this.runCore(body[i]);
          if (is.existy(res)) all.push(res);
        }
        if (is.not.empty(all)) return all;
      } else {
        return await this.runCore(body);
      }

      // this.context({ req, services: this.services });
    } catch (e) {
      return new RpcErrorResponse(e);
    }
  }
}

/**
 * JrusServer
 *
 * works as a services pool; each service includes several actions.
 * is able to work indenpendently, or work as a koa/express middleware.
 */
export class JrusServer {
  constructor() {
    this.services = {};
    this.mounts = {};
  }

  // register a service
  // if name is not specified, use the class name of service class
  register(ServiceClass, name) {
    let serviceName;
    if (is.string(name)) {
      serviceName = name;
    } else if (is.object(ServiceClass) && is.string(ServiceClass.name)) {
      serviceName = ServiceClass.name;
    } else {
      throw new Error('name ill-format');
    }
    if (this.services[serviceName] !== undefined) throw new Error(`service ${serviceName} already exist`);
    this.services[serviceName] = new ServiceClass();
    return this;
  }

  // unregister a service
  unregister(name) {
    let serviceName;
    if (is.object(name) && is.string(name.name)) {
      serviceName = name.name;
    } else if (is.string(name)) {
      serviceName = name;
    } else {
      throw new Error('name ill-format');
    }
    const { [serviceName]: _service, ...rest } = this.services;
    this.services = rest;
    return this;
  }

  // mount
  mount(map) {
    Object.assign(this.mount, map);
    return this;
  }

  async buildContext() {
    const obj = {};
    const mountEntries = Object.entries(this.mounts);
    for (let i = 0; i < mountEntries.length; i += 1) {
      const [key, fn] = mountEntries[i];
      if (is.function(fn)) {
        obj[key] = await fn();
      }
    }
    return obj;
  }

  // work independently and listen on some port;
  listen(port) {
    const http = require('http');
    http.createServer((req, res) => {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Request-Method', '*');
      res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
      res.setHeader('Access-Control-Allow-Headers', '*');
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const runner = new RpcRunner(this.services);
      this.buildContext().then((ctx) => {
        runner.context(ctx);
        runner.run(req).then((r) => {
          res.setHeader('Content-Type', 'application/json');
          res.write(JSON.stringify(r));
          res.end();
        }).catch((e) => {
          res.write(JSON.stringify(new RpcErrorResponse(e)));
          res.end();
        });
      });
    }).listen(port);
  }

  // build the middleware for koa
  koa() {
    return async (ctx, next) => {
      await next();
      const runner = new RpcRunner(this.services);
      runner.context(await this.buildContext());
      try {
        ctx.body = JSON.stringify(await runner.run(ctx.req));
      } catch (e) {
        ctx.body = JSON.stringify(new RpcErrorResponse(e));
      }
    };
  }
}

import parser from 'co-body';
import is from 'is_js';
import http from 'http';
import { RpcRunner } from 'jrus-share';

/**
 * JrusServer
 *
 * works as a services pool; each service includes several actions.
 * is able to work indenpendently, or work as a koa/express middleware.
 */
export class JrusServer {
  constructor() {
    this.services = {};
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

  // backup services and build a method selector for jsonrpc
  buildMethodSelector() {
    const services = { ...this.services };
    return (method) => {
      const [service, action] = method.split('.');
      if (service && action && services[service] && services[service][action]) return services[service][action];
      return null;
    };
  }

  // build the jronrpc runner
  buildRunner() {
    return new RpcRunner(this.buildMethodSelector());
  }

  // build the middleware for koa
  buildMiddleware() {
    const runner = this.buildRunner();
    return async (ctx, next) => {
      await next();
      let body;
      try {
        body = await parser(ctx);
      } catch (e) {
        body = undefined;
      }
      ctx.body = await runner.run(body);
    };
  }

  // work independently and listen on some port;
  listen(port) {
    const runner = this.buildRunner();
    http.createServer((req, res) => {
      parser(req)
        .then(body => body)
        .catch(() => undefined)
        .then(body => runner.run(body))
        .then((r) => {
          res.setHeader('Content-Type', 'application/json');
          res.write(JSON.stringify(r));
          res.end();
        });
    }).listen(port);
  }
}

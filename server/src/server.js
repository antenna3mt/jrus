import parser from 'co-body';
import Koa from 'koa';
import cors from '@koa/cors';
import { RpcRunner } from 'jrus-share';

export class JrusServer {
  constructor() {
    this.services = {};
  }

  // register a service
  register(ServiceClass, name) {
    const serviceName = name || ServiceClass.name;
    if (this.services[serviceName] !== undefined) throw new Error(`service ${serviceName} already exist`);
    this.services[serviceName] = new ServiceClass();
    return this;
  }

  // unregister a service
  unregister(ServiceClass) {
    const serviceName = ServiceClass.name || ServiceClass;
    const { [serviceName]: _service, ...rest } = this.services;
    this.services = rest;
    return this;
  }

  buildMethodSelector() {
    return (method) => {
      const [service, action] = method.split('.');
      if (service && action && this.services[service] && this.services[service][action]) return this.services[service][action];
      return null;
    };
  }

  buildRunner() {
    return new RpcRunner(this.buildMethodSelector());
  }

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

  listen(port) {
    new Koa()
      .use(cors())
      .use(this.buildMiddleware())
      .listen(port);
  }
}

import { RpcRunner, JrusError } from '../src';

const runner = new RpcRunner(method => (...args) => {
  throw new JrusError({ message: 'Hello?' });
});


(async () => {
  const res = await runner.run({
    jsonrpc: '2.0',
    method: 'method',
    params: {
      name: 'Yi Jin',
    },
    id: 1,
  });

  console.error(res);
})();


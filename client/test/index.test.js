import { JrusClient } from '../src';

const client = new JrusClient('http://localhost:3000');

(async () => {
  let result;
  result = await client.services.B.say();
  console.error(result);

  result = await client.services.B.mirror({ kk: 1 });
  console.error(result);

  try {
    await client.services.B.wrong();
  } catch (e) {
    console.error(e);
  }
})().catch(e => console.error('uncaught error:', e));


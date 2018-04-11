import { JrusClient } from '../src';

const client = new JrusClient('http://localhost:3002');
client.setHeader('auth', '123');

(async () => {
  let result;
  result = await client.services.B.say();
  console.error(result);

  result = await client.services.B.mirror({ kk: 1 });
  console.error(result);

  try {
    await client.services.B.wrong2();
  } catch (e) {
    console.error(e);
  }

  try {
    await client.services.B.req();
  } catch (e) {
    console.error(e);
  }

  console.error(await client.services.B.test1());

  console.error(await client.services.B.test2());
  console.error(await client.services.B.test4());
  console.error(await client.services.B.test5());

  console.error(await client.services.B.rpc(2));
  // console.log(await client.services.B.test2());

  try {
    await client.services.B.test3();
  } catch (e) {
    console.error(e);
  }
})().catch(e => console.error('uncaught error:', e));


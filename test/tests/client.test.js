import { JrusClient } from 'jrus-client';

// 新建一个client，并连接http://localhost:3000
const client = new JrusClient('http://localhost:300');

(async () => {
  // 调用远程函数 Utility.time
  console.log(await client.services.Utility.time());
  // 018-03-31T15:54:37.568Z

  // 调用远程函数 Utility.sayHi, 并传递参数
  console.log(await client.services.Utility.sayHi({ name: 'Special Name' }));
  // { say: 'hello, Special Name ' }

  // 调用远程函数 Utility.wrong, 并 catch 错误/异常
  try {
    await client.services.Utility.wrong();
  } catch (e) {
    console.error('Error caught: ', e);
    // Error caught:  JrusError { code: 10056, message: 'sampleerror' }
  }

  // 调用不存在的函数 Utility.right
  try {
    await client.services.Utility.right();
  } catch (e) {
    console.error('Error caught: ', e);
    // Error caught:  JrusError { code: -32601, message: 'Method not found' }
  }
})()
  .catch(e => console.log(e.toString()));


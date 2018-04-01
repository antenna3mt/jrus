# Jrus

Jrus 是一个前后端统一通信实用工具包；基于jsonrpc 2.0；前端工具和后端工具可以分开使用，分别行使jsonrpc server 和jsonrpc client 的功能；配套使用效果更佳。

## 安装

Client端: `npm i jrus-client`

Server端: `npm i jrus-server`

## 快速开始

### Server端

```javascript
import { JrusServer, JrusError } from 'jrus-server';

class Utility {
  async time() {
    return new Date();
  }
  async sayHi({ name }) {
    return { say: `hello, ${name} ` };
  }
  async wrong() {
    throw new JrusError({ code: 10056, message: 'sample error' });
  }
}

// 新建一个server
const server = new JrusServer();

// 注册一个service
server.register(Utility);

// 运行server
server.listen(3000);

```

### Client代码

```javascript
import { JrusClient } from 'jrus-client';

// 新建一个client，并连接http://localhost:3000
const client = new JrusClient('http://localhost:3000');

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
})();
```

## Repo

- [jrus-share](https://github.com/antenna3mt/jrus-share)
- [jrus-client](https://github.com/antenna3mt/jrus-client)
- [jrus-server](https://github.com/antenna3mt/jrus-server)
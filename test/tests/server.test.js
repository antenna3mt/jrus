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

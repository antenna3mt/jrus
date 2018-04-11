import { JrusServer, JrusError } from '../src';

class B {
  constructor() {
    this.count = 0;
  }

  async counter() {
    this.count += 1;
    return this.count;
  }

  async before() {
    console.error(this.req.headers.auth);
  }

  async after() {
    // console.error('after');
  }

  async say() {
    return 'hello from B';
  }

  async wrong() {
    throw new JrusError({ message: 'error from B' });
  }

  async wrong2() {
    throw new Error('error2');
  }

  async mirror(obj) {
    return obj;
  }

  async req() {
    return this.req;
  }

  async test1() {
    return this.services.B.rpc.bind(this)();
  }

  async test2() {
    const d = { a: 1 };
    return [d, d];
  }

  async test3() {
    this.k.k();
  }

  async test4() {
    return [this.bb, this.cc];
  }

  async rpc() {
    return this.rpc;
  }

  async test5() {
    return this.test4();
  }

  async test6({ name }) {
    return name;
  }
}


const server = new JrusServer()
  .register(B)
  .mount({
    bb: () => '??',
    cc: async () => 'kk',
  });
server.listen(3002);
console.warn('listening');


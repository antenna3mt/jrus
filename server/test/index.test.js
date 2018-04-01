import { JrusServer, JrusError } from '../src';

class B {
  async say() {
    return 'hello from B';
  }
  async wrong() {
    throw new JrusError({ message: 'error from B' });
  }
  async mirror(obj) {
    return obj;
  }
}


const server = new JrusServer()
  .register(A)
  .register(B);

server.listen(3000);
console.warn('listening');

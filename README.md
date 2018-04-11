# Jrus

Jrus is a server-client communication utility package, which facilitates **seamless** remote procedure call.

The communication protocol Jrus uses is [jsonrpc 2.0](http://www.jsonrpc.org/specification).


## Install

`npm i jrus`

## Quick Start

### Server side

```javascript
import { JrusServer, JrusError } from 'jrus';

// create a new server instance
const server = new JrusServer();

// register a service
server.register(class Utility {
  async time() {
    return new Date();
  }
  async sayHi({ name }) {
    return { say: `hello, ${name} ` };
  }
  async wrong() {
    throw new JrusError({ code: 10056, message: 'sample error' });
  }
});

// run and listen on port 3000
server.listen(3000);

```


### Client side

```javascript
import { JrusClient } from 'jrus';

// create a client and connect http://localhost:3000
const client = new JrusClient('http://localhost:3000');

(async () => {
  // remote procedure call: Utility.time
  console.log(await client.services.Utility.time());
  // 018-03-31T15:54:37.568Z

  // remote procedure call: Utility.sayHi, with parameters { name: 'Special Name' }
  console.log(await client.services.Utility.sayHi({ name: 'Special Name' }));
  // { say: 'hello, Special Name ' }

  // remote procedure call: Utility.wrong; and cathc error thrown on the server side
  try {
    await client.services.Utility.wrong();
  } catch (e) {
    console.error('Error caught: ', e);
    // Error caught:  JrusError { code: 10056, message: 'sample error' }
  }

  // call some function nonexist: Utility.right
  try {
    await client.services.Utility.right();
  } catch (e) {
    console.error('Error caught: ', e);
    // Error caught:  JrusError { code: -32601, message: 'Method not found' }
  }
})();
```


### TODO
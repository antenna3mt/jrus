import { JrusServer } from 'jrus-server';


const server = new JrusServer()
  .register(class Blog {
    constructor() {
      this.articles = [];
    }
    async get() {
      console.log(this.articles);
      return this.articles;
    }
    async save(article) {
      this.articles.push(article);
      return '1';
    }
  });

server.listen(3000);
console.warn('listening');


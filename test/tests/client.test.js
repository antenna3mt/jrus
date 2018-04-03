import { JrusClient } from 'jrus-client';

const client = new JrusClient('http://localhost:3000');

(async () => {
  await client.services.Blog.save({ title: '天天向上', content: ' 好好学习2' });
  const articles = await client.services.Blog.get();
  console.error(articles);
})().catch(e => console.error('uncaught error:', e));


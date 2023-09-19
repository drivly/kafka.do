import { Router, error, json, withParams } from 'itty-router'
import { UpstashKafka } from './UpstashKafka'
import { QueueProducer } from './producer'
let kafka
const withCtx = async (request, env) => {
  request.ctx = await env.CTX.fetch(request).then((res) => res.json())
  request.env = env
  if (!request.ctx.user?.authenticated) {
    return Response.redirect('/login')
  }
  if (!['admin', 'worker'].includes(request.ctx.user.role)) {
    return error(403, { api: request.api, error: 'Forbidden', user: request.ctx.user })
  }
  request.api = {
    icon: '▥',
    name: 'kafka.do',
    description: 'Cloudflare Worker API for Kafka with webhooks',
    url: 'https://kafka.do',
    endpoints: {
      listQueues: request.ctx.origin + '/queues',
      consume: request.ctx.origin + '/:queue',
      produce: request.ctx.origin + '/:queue/send/:message',
      sendBatch: request.ctx.origin + '/:queue/sendBatch',
    },
    memberOf: 'https://apis.do/pubsub',
    login: request.ctx.origin + '/login',
    logout: request.ctx.origin + '/logout',
    repo: 'https://github.com/drivly/kafka.do',
  }
  if (!kafka) kafka = new UpstashKafka(env.QUEUE_SERVER, env.QUEUE_USERNAME, env.QUEUE_PASSWORD)
}

const router = Router()
router.all('*', withCtx)
router.all('*', withParams)
router.all('*', (request, env) => {
  if (request.url.endsWith('favicon.ico')) return error(404)
  const { queue, message } = request.params
  if (queue && (message || request.method === 'POST')) QueueProducer(queue, env)
})

router.get('/', async (request) => json({ api: request.api, data: await kafka.listQueues(), user: request.ctx.user }))
router.get('/api', async (request) => json({ api: request.api, data: await kafka.listQueues(), user: request.ctx.user }))
router.get('/queues', async (request) => json({ api: request.api, data: await kafka.listQueues(), user: request.ctx.user }))

router.get('/:queue/send/:message', async (request, env) => {
  const { queue, message } = request.params
  const data = await env[queue].send(message)
  return json({ api: request.api, data, user: request.ctx.user })
})

router.post('/:queue/send', send)
router.post('/:queue/sendBatch', send)

async function send(request, env) {
  const { queue } = request.params
  const messages = await request.json()
  const data = await env[queue].sendBatch(messages)
  return json({ api: request.api, data, user: request.ctx.user })
}

router.get('/:queue', async (request) => {
  const { queue: topic } = request.params
  const data = await kafka.queue(topic)
  return json({ api: request.api, data, user: request.ctx.user })
})

router.get('/:queue/:group', async (request) => {
  const { queue: topic, group } = request.params
  const data = await kafka.queue(topic, group)
  return json({ api: request.api, data, user: request.ctx.user })
})

router.get('/:queue/:group/:partition', async (request) => {
  const { queue: topic, partition, group } = request.params
  const data = await kafka.queue(topic, group, partition)
  return json({ api: request.api, data, user: request.ctx.user })
})

router.get('*', (request) => error(404, { api: request.api, error: 'Not Found', user: request.ctx.user }))

export default {
  fetch(request, env) {
    return router.handle(request, env)
  },
}

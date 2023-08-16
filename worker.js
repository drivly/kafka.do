import { Router, json } from 'itty-router'
import { Kafka } from '@upstash/kafka'

const kafkaConfig = {
    url: env.KAFKA_URL,
    username: env.KAFKA_USERNAME,
    password: env.KAFKA_PASSWORD,
  }

const withCtx = async (request, env) => {
  request.ctx = await env.CTX.fetch(request).then((res) => res.json())
  console.log(request)
  if (!request.ctx.user) {
    return Response.redirect('/login')
  }
  request.api = {
    icon: '🌎',
    name: 'kafka.do',
    description: 'Cloudflare Worker API for Kafka with webhooks',
    url: 'https://kafka.do',
    endpoints: {
      listAll: request.ctx.origin + '/',
      consume: request.ctx.origin + '/:queue',
      produce: request.ctx.origin + '/:queue/send/:message',
      acknowledgeAll: request.ctx.origin + '/:queue/ackAll',
      retryAll: request.ctx.origin + '/:queue/retryAll',
      acknowledge: request.ctx.origin + '/:queue/ack/:messageId',
      retry: request.ctx.origin + '/:queue/retry/:messageId',
      createWebhook: request.ctx.origin + '/:queue/webhook/:url',
      listWebhooks: request.ctx.origin + '/:queue/webhook',
    },
    memberOf: 'https://apis.do/pubsub',
    login: request.ctx.origin + '/login',
    logout: request.ctx.origin + '/logout',
    repo: 'https://github.com/drivly/kafka.do',
  }
}

const router = Router()
router.all('*', withCtx)



router.get('*', (request) => json({ api: request.api, error: 'Not Found', user: request.ctx.user }, { status: 404 }))

export default {
  fetch(request, env) {
    return router.handle(request, env)
  },
}

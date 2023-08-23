# kafka.do

`kafka.do` is a simple API for managing Kafka-based queues. Webhook URLs can be added to retrofit existing applications to consume from queues without needing to modify the application itself to subscribe to Kafka topics. Below are the available endpoints.

## Endpoints

### List all registered servers

```http
GET /
```

### List all registered queues on server

```http
GET /:server
```

### Consume from a queue

```http
GET /:server/:queue
```

### Produce a message to a queue

```http
GET /:server/:queue/send/:message
```

### Send a batch of messages

```http
POST /:server/:queue/sendBatch
```

Payload:

```json
["message1", "message2"]
```

### Acknowledge all messages as consumed

```http
GET /:server/:queue/ackAll
```

### Mark all messages to be retried

```http
GET /:server/:queue/retryAll
```

### Acknowledge a message as consumed

```http
GET /:server/:queue/ack/:messageId
```

### Mark a message to be retried

```http
GET /:server/:queue/retry/:messageId
```

### Automatically consume to a webhook URL

```http
GET /:server/:queue/webhook/:url
```

### List a queue's registered webhooks

```http
GET /:server/:queue/webhook
```

## Parameters

Each queue endpoint registers a topic if it is not already registered and accepts the following parameters to change queue behavior:

- `maxBatchSize`: The maximum number of messages allowed in each batch.
- `maxBatchTimeout`: The maximum number of seconds to wait until a batch is full.
- `maxRetries`: The maximum number of retries for a message, if it fails or retryAll is invoked.
- `deadLetterQueue`: The name of another queue to send a message if it fails processing at least maxRetries times. If a deadLetterQueue is not defined, messages that repeatedly fail processing will eventually be discarded. If there is no queue with the specified name, it will be created automatically.
- `maxConcurrency`: The maximum number of concurrent consumers allowed to run at once. Leaving this unset means that the number of invocations will scale to the currently supported maximum.


## Cloudflare Worker Queue Compatibility

### Producer

```typescript
import { QueueProducer } from 'kafka.do'

export default {
fetch: (req, env, ctx) = {
    QueueProducer('MY_QUEUE', env)
    await env.MY_QUEUE.send({
      url: req.url,
      method: req.method,
      headers: Object.fromEntries(req.headers),
    }
    return new Response('Sent!')
  }
}
```

#### QueuesContentType

```typescript
type QueuesContentType = "text" | "bytes" | "json" | "v8"
```

### Consumer

```typescript
import { QueueConsumer } from 'kafka.do'

export default QueueConsumer({
  async queue(
    batch: MessageBatch,
    env: Environment,
    ctx: ExecutionContext
  ): Promise<void> {
    for (const message of batch.messages) {
      console.log('Received', message)
    }
  },
})
```

#### MessageBatch

```typescript
interface MessageBatch<Body = unknown> {
  readonly queue: string
  readonly messages: Message<Body>[]
  ackAll(): void
  retryAll(): void
}
```

#### Message

```typescript
interface Message<Body = unknown> {
  readonly id: string
  readonly timestamp: Date
  readonly body: Body
  ack(): void
  retry(): void
}
```

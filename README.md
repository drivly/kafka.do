# kafka.do

`kafka.do` is a simple API for managing Kafka-based queues. Webhook URLs can be added to retrofit existing applications to consume from queues without needing to modify the application itself to subscribe to Kafka topics. Below are the available endpoints.

## Endpoints

### List all queues

```http
GET /
```

### Consume from a queue

```http
GET /:queue
```

### Produce a message to a queue

```http
GET /:queue/send/:message
```

### Send a batch of messages

```http
POST /:queue/sendBatch
```

Payload:

```json
["message1", "message2"]
```

### Acknowledge all messages as consumed

```http
GET /:queue/ackAll
```

### Mark all messages to be retried

```http
GET /:queue/retryAll
```

### Acknowledge a message as consumed

```http
GET /:queue/ack/:messageId
```

### Mark a message to be retried

```http
GET /:queue/retry/:messageId
```

### Automatically consume to a webhook URL

```http
GET /:queue/webhook/:url
```

### List a queue's webhooks

```http
GET /:queue/webhook
```

## Parameters

Each endpoint besides list creates the queue if it does not exist and accepts the following parameters to change queue behavior:

- `maxBatchSize`: The maximum number of messages allowed in each batch.
- `maxBatchTimeout`: The maximum number of seconds to wait until a batch is full.
- `maxRetries`: The maximum number of retries for a message, if it fails or retryAll is invoked.
- `deadLetterQueue`: The name of another queue to send a message if it fails processing at least maxRetries times. If a deadLetterQueue is not defined, messages that repeatedly fail processing will eventually be discarded. If there is no queue with the specified name, it will be created automatically.
- `maxConcurrency`: The maximum number of concurrent consumers allowed to run at once. Leaving this unset means that the number of invocations will scale to the currently supported maximum.

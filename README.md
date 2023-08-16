# kafka.do

kafka.do is a simplified interface for Kafka topics, allowing you to easily manage topics for subscriptions and webhooks.

## Endpoints

### List all queues

- `GET /`

### Consume from a queue

- `GET /:queue`

### Produce a message to a queue

- `GET /:queue/send/:message`

### Send a batch of messages

- `POST /:queue/sendBatch`

  ```json
  ["message1", "message2"]
  ```

### Acknowledge all messages as consumed

- `GET /:queue/ackAll`

### Mark all messages to be retried

- `GET /:queue/retryAll`

### Acknowledge a message as consumed

- `GET /:queue/ack/:messageId`

### Mark a message to be retried

- `GET /:queue/retry/:messageId`

### Automatically consume to a webhook URL

- `GET /:queue/webhook/:url`

### List queue webhooks

- `GET /:queue/webhook`

## Parameters

Each endpoint creates the queue if it does not exist and accepts the following parameters to change queue behavior:

- `maxBatchSize`: The maximum number of messages allowed in each batch.

- `maxBatchTimeout`: The maximum number of seconds to wait until a batch is full.

- `maxRetries`: The maximum number of retries for a message, if it fails or retryAll is invoked.

- `deadLetterQueue`: The name of another queue to send a message if it fails processing at least maxRetries times. If a deadLetterQueue is not defined, messages that repeatedly fail processing will eventually be discarded. If there is no queue with the specified name, it will be created automatically.

- `maxConcurrency`: The maximum number of concurrent consumers allowed to run at once. Leaving this unset will mean that the number of invocations will scale to the currently supported maximum.

# kafka.do

kafka.do is a simplified interface for Kafka topics, allowing you to easily manage your Kafka queues.

## Endpoints

### List all queues

- `GET /`
  
### Consume from a queue

- `GET /:queue`

### Produce a message to a queue

- `GET /:queue/send/:message`

### Send an array of messages as JSON

- `POST /:queue/sendBatch`

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

- `max_batch_size`: The maximum number of messages allowed in each batch.

- `max_batch_timeout`: The maximum number of seconds to wait until a batch is full.

- `max_retries`: The maximum number of retries for a message, if it fails or retryAll is invoked.

- `dead_letter_queue`: The name of another Queue to send a message if it fails processing at least max_retries times. If a dead_letter_queue is not defined, messages that repeatedly fail processing will eventually be discarded. If there is no Queue with the specified name, it will be created automatically.

- `max_concurrency`: The maximum number of concurrent consumers allowed to run at once. Leaving this unset will mean that the number of invocations will scale to the currently supported maximum.

# kafka.do

kafka.do is a simple Cloudflare Worker-based API that provides an easy-to-use Kafka topic production and consumption interface with support for webhooks.

If you don't already have a browser extension to pretty-print JSON and make links clickable, start by installing that: <https://extensions.do>

## APIs

### Produce a message to a Kafka topic

To produce a message to a Kafka topic, send a GET request to the following endpoint:

```
https://kafka.do/producer/{topic}/{message}
```

#### Example request

```
https://kafka.do/producer/test-topic/hello-world
```

#### Response

```json
{
  ...
  "topic": "test-topic",
  "message": "hello-world",
  "offset": 42
}
```

### Consume a single message from a Kafka topic

To consume a single message from a Kafka topic, send a GET request to the following endpoint:

```
https://kafka.do/consumer/{topic}
```

#### Example request

```
https://kafka.do/consumer/test-topic
```

#### Response

```json
{
  ...
  "topic": "test-topic",
  "message": "hello-world",
  "offset": 42
}
```

### Webhooks setup

To set up a webhook for consuming messages from Kafka topics automatically, send a GET request to the following endpoint:

```
https://kafka.do/webhook/{topic}/{callback_url}
```

#### Example request

```
https://kafka.do/webhook/test-topic/https://yourapp.com/consume
```

#### Response

```json
{
  ...
  "topic": "test-topic",
  "callback_url": "https://yourapp.com/consume",
  "webhook_id": "webhook_12345"
}
```

With this webhook setup, whenever there's a new message on the specified topic, kafka.do will automatically send a POST request to the provided `callback_url`. The request body will contain the message as follows:

```json
{
    "topic": "test-topic",
    "message": "hello-world",
    "offset": 42
}
```

## Error messages

In case of an error, the response will contain an `error` message describing the issue:

```json
{
  ...
  "error": "Error message"
}
```

Examples of error messages include:

1. "Topic not found"
2. "Invalid webhook URL"

##  🚀 We're Hiring!

[Driv.ly](https://driv.ly) is [deconstructing the monolithic physical dealership](https://blog.driv.ly/deconstructing-the-monolithic-physical-dealership) into [simple APIs to buy and sell cars online](https://driv.ly), and we're funded by some of the [biggest names](https://twitter.com/TurnerNovak) in [automotive](https://fontinalis.com/team/#bill-ford) and [finance & insurance](https://www.detroit.vc)

Our entire infrastructure is built with [Cloudflare Workers](https://workers.do), [Durable Objects](https://durable.objects.do), [KV](https://kv.cf), [PubSub](https://pubsub.do), [R2](https://r2.do.cf), [Pages](https://pages.do), etc.  [If you love the Cloudflare Workers ecosystem as much as we do](https://driv.ly/loves/workers), we'd love to have you [join our team](https://careers.do/apply)!

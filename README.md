# kafka.do

kafka.do is a simple Cloudflare Worker-based API that provides an easy-to-use Kafka topic production and consumption interface with support for webhooks.

If you don't already have a browser extension to pretty-print JSON and make links clickable, start by installing that: <https://extensions.do>

## Table of Contents

- [List all topics](#list-all-topics)
- [Produce a message to a Kafka topic](#produce-a-message-to-a-kafka-topic)
- [Consume messages from Kafka topic](#consume-messages-from-kafka-topic)
  - [Consume a single message from a Kafka topic](#consume-a-single-message-from-a-kafka-topic)
  - [Consume multiple messages from a Kafka topic](#consume-multiple-messages-from-a-kafka-topic)
- [Fetch messages from Kafka topic](#fetch-messages-from-kafka-topic)
  - [Fetch a single message from a Kafka topic](#fetch-a-single-message-from-a-kafka-topic)
  - [Fetch multiple messages from a Kafka topic](#fetch-multiple-messages-from-a-kafka-topic)
- [Webhooks setup](#webhooks-setup)
- [Error messages](#error-messages)

For all methods except list, if a topic does not exist, it is created.

## List all topics

To get a list of all available Kafka topics, send a GET request to the following endpoint:

```http
GET /topics
```

### Example request

```curl
curl https://<you>.kafka.do/topics
```

### Response

```json
{
  "topics": [
    {
      "name": "test-topic-1",
      "created_at": "2022-09-15T10:30:20Z"
    },
    {
      "name": "test-topic-2",
      "created_at": "2022-09-16T14:45:12Z"
    },
    {
      "name": "test-topic-3",
      "created_at": "2022-09-17T09:20:52Z"
    }
  ]
}
```

This endpoint returns a list of Kafka topic objects, each containing the topic name and its creation timestamp.

## Produce a message to a Kafka topic

To produce a message to a Kafka topic, send a GET request to the following endpoint:

```http
GET /producer/{topic}/{message}
```

### Example request

```curl
curl https://<you>.kafka.do/producer/test-topic/hello-world
```

### Response

```json
{
  "topic": "test-topic",
  "message": "hello-world",
  "offset": 42
}
```

## Consume messages from Kafka topic

The `consume` methods allow you to consume messages from a topic. These methods update a topic's offset if any messages are consumed.

### Consume a single message from a Kafka topic

To consume a single message from a Kafka topic, send a GET request to the following endpoint:

```http
GET /consumer/{topic}
```

#### Example request

```curl
curl https://<you>.kafka.do/consumer/test-topic
```

#### Response

```json
{
  "topic": "test-topic",
  "message": "hello-world",
  "offset": 42
}
```

### Consume multiple messages from a Kafka topic

To consume multiple messages from a Kafka topic in bulk, send a GET request to the following endpoint:

```http
GET /consumer/{topic}/{count}
```

Where `{count}` is the number of messages you want to consume at once.

#### Example request

```curl
curl https://<you>.kafka.do/consumer/test-topic/5
```

#### Response

```json
{
  "topic": "test-topic",
  "messages": [
    {
      "message": "hello-world-1",
      "offset": 42
    },
    {
      "message": "hello-world-2",
      "offset": 43
    },
    {
      "message": "hello-world-3",
      "offset": 44
    },
    {
      "message": "hello-world-4",
      "offset": 45
    },
    {
      "message": "hello-world-5",
      "offset": 46
    }
  ]
}
```

This endpoint returns a list of messages from the specified Kafka topic along with their respective offsets. The number of messages in the response may be smaller than the requested count if there are fewer available messages in the topic at the time of the request.

## Fetch messages from Kafka topic

The `fetch` methods allow you to retrieve messages from a Kafka topic without actually consuming them and modifying the consumed offset. This is useful when you want to preview messages without affecting the state of the topic.

### Fetch a single message from a Kafka topic

To fetch a single message from a Kafka topic, send a GET request to the following endpoint:

```http
GET /fetch/{topic}
```

#### Example request

```curl
curl https://<you>.kafka.do/fetch/test-topic
```

#### Response

```json
{
  "topic": "test-topic",
  "message": "hello-world",
  "offset": 42
}
```

### Fetch multiple messages from a Kafka topic

To fetch multiple messages from a Kafka topic in bulk, send a GET request to the following endpoint:

```http
GET /fetch/{topic}/{count}
```

Where `{count}` is the number of messages you want to fetch at once.

#### Example request

```curl
curl https://<you>.kafka.do/fetch/test-topic/5
```

#### Response

```json
{
  "topic": "test-topic",
  "messages": [
    {
      "message": "hello-world-1",
      "offset": 42
    },
    {
      "message": "hello-world-2",
      "offset": 43
    },
    {
      "message": "hello-world-3",
      "offset": 44
    },
    {
      "message": "hello-world-4",
      "offset": 45
    },
    {
      "message": "hello-world-5",
      "offset": 46
    }
  ]
}
```

This endpoint returns a list of messages from the specified Kafka topic along with their respective offsets, without modifying the consumed offset. The number of messages in the response may be smaller than the requested count if there are fewer available messages in the topic at the time of the request.

## Webhooks setup

To set up a webhook for consuming messages from Kafka topics automatically, send a GET request to the following endpoint:

```http
GET /webhook/{topic}/{callback}
```

### Example request

```curl
curl https://<you>.kafka.do/webhook/test-topic/https://yourapp.com/consume
```

### Response

```json
{
  "topic": "test-topic",
  "callback": "https://yourapp.com/consume",
  "id": "webhook_12345"
}
```

With this webhook setup, whenever there's a new message on the specified topic, kafka.do will automatically send a POST request to the provided `callback`. The request body will contain the message as follows:

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
  "error": "Error message"
}
```

Examples of error messages include:

1. "Topic not found"
2. "Invalid webhook URL"

## 🚀 We're Hiring

[Driv.ly](https://driv.ly) is [deconstructing the monolithic physical dealership](https://blog.driv.ly/deconstructing-the-monolithic-physical-dealership) into [simple APIs to buy and sell cars online](https://driv.ly), and we're funded by some of the [biggest names](https://twitter.com/TurnerNovak) in [automotive](https://fontinalis.com/team/#bill-ford) and [finance & insurance](https://www.detroit.vc)

Our entire infrastructure is built with [Cloudflare Workers](https://workers.do), [Durable Objects](https://durable.objects.do), [KV](https://kv.cf), [PubSub](https://pubsub.do), [R2](https://r2.do.cf), [Pages](https://pages.do), etc.  [If you love the Cloudflare Workers ecosystem as much as we do](https://driv.ly/loves/workers), we'd love to have you [join our team](https://careers.do/apply)!

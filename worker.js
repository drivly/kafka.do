import { Router } from "itty-router"
import { Kafka, groupId, setJSON } from "@upstash/kafka"; 

const router = Router()
const kafkaConfig = {
  clientId: "kafka-do",
  brokers: JSON.parse(KAFKA_BOOTSTRAP_SERVERS),
  ssl: true,
  sasl: {
    mechanism: "scram-sha-256",
    username: KAFKA_USERNAME,
    password: KAFKA_PASSWORD,
  },
}

router.get("/topics", async (request) => {
  const kafka = new Kafka(kafkaConfig)
  const admin = kafka.admin()

  try {
    await admin.connect()
    const { topics } = await admin.listTopics()
    await admin.disconnect()

    return new Response(JSON.stringify({ topics }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
router.get("/producer/:topic/:message", async (request, { topic, message }) => {
  const kafka = new Kafka(kafkaConfig)
  const producer = kafka.producer()

  try {
    await producer.connect();
    const { baseOffset } = await producer.send({
      topic,
      messages: [{ value: message }],
    })
    await producer.disconnect();

    return new Response(
      JSON.stringify({ topic, message, offset: baseOffset }),
      { status: 200 }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})

async function consumeSingleMessage(topic, groupId) {
  const kafka = new Kafka(kafkaConfig);
  const consumer = kafka.consumer({ groupId });

  try {
    await consumer.connect()
    await consumer.subscribe({ topic })
    const messages = await consumer.runOnce({ autoCommit: true, eachMessage: true })
    await consumer.disconnect()

    if (messages && messages.length > 0) {
      return messages[0]
    } else {
      return null
    }
  } catch (error) {
    throw error
  }
}

router.get("/consumer/:topic", async (request, { topic }) => {
  try {
    const message = await consumeSingleMessage(topic, groupId);

    if (message) {
      return new Response(
        JSON.stringify({ topic, message: message.value, offset: message.offset }),
        { status: 200 }
      );
    } else {
      return new Response(JSON.stringify({ error: "No messages available" }), {
        status: 404 
      }) 
    }
  } catch (error) { 
     return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}) 

async function consumeMultipleMessages(topic, groupId, count) { 
const kafka = new Kafka(kafkaConfig); 
const consumer = kafka.consumer({ groupId }); 
try { 
      await consumer.connect(); 
      await consumer.subscribe({ topic }); 
      const messages = await consumer.runOnce({ 
        autoCommit: true, 
        maxMessages: count, 
        eachMessage: true, 
      }); 
      await consumer.disconnect(); 
       return messages; 
    } catch (error) { 
      throw error; 
    } 
  } 

router.get("/consumer/:topic/:count", async (request, { topic, count }) => { 
  try { 
    const messages = await consumeMultipleMessages(topic, groupId, parseInt(count)); 

    if (messages && messages.length > 0) { 
      return new Response( 
        JSON.stringify({ 
          topic, 
          messages: messages.map((message) => ({ 
            message: message.value, 
            offset: message.offset, 
          })), 
        }), 
        { status: 200 } 
      ); 
    } else { 
      return new Response(JSON.stringify({ error: "No messages available" }), { 
        status: 404, 
      }); 
    } 
  } catch (error) { 
    return new Response(JSON.stringify({ error: error.message }), { status: 500 }); 
  } 
}); 

router.get("/fetch/:topic", async (request, { topic }) => {
  try {
    const message = await consumeSingleMessage(topic, groupId + "-fetch");

    if (message) {
      return new Response(
        JSON.stringify({ topic, message: message.value, offset: message.offset }),
        { status: 200 }
      );
    } else {
      return new Response(JSON.stringify({ error: "No messages available" }), {
        status: 404,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});


router.get("/fetch/:topic/:count", async (request, { topic, count }) => {
  try {
    const messages = await consumeMultipleMessages(topic, groupId + "-fetch", parseInt(count));

    if (messages && messages.length > 0) {
      return new Response(
        JSON.stringify({
          topic,
          messages: messages.map((message) => ({
            message: message.value,
            offset: message.offset,
          })),
        }),
        { status: 200 }
      )
    } else {
      return new Response(JSON.stringify({ error: "No messages available" }), {
        status: 404,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})


router.get("/webhook/:topic/:callback", async (request, { topic, callback }) => {
  try {
    const webhookId = "webhook_" + Math.random().toString(36).substr(2, 9)
    await setJSON(UPSTASH_REDIS_URL, webhookId, { topic, callback })

    return new Response(
      JSON.stringify({ topic, callback, id: webhookId }),
      { status: 200 }
    )
  } catch (error) {
    return new Response(JSON.stringify({ a: error.message }), { status: 500 })
  }
})

addEventListener("fetch", (event) => {
  event.respondWith(router.handle(event.request));
})

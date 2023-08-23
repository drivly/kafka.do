const QueueConsumer = workerClass => {
  workerClass.scheduled = (event, env, ctx) => {
    // create the DO instances
  }
  workerClass.alarm = async () => {
    // do a long poll of the Upstash API
    const results = await fetch(`https://${env.CLUSTER_NAME}-rest-kafka.upstash.io/fetch`).then(res => res.json())
    const event = {
      queue: env.CLUSTER_NAME,
      messages =  results.map(result => {
        return { 
          id: result.id,  // TODO: map this correctly
          timestamp: result.ts,  // TODO: map this correctly
          body: result.data,  // TODO: map this correctly
          ack: () => {
            // TODO: figure out the logic to `ack` this message
          },
          retry: () => {
            // TODO: figure out the logic to `retry` this message
          }
        }
      })
    }
    // This is where we're translating the pull from upstash into a push for simple and easy-to-create PubSub nano-services on Cloudflare
    await workerClass.queue(event, env, ctx)
   
  }
  return workerClass
}


export default {
  async scheduled(event, env, ctx) {
    // TODO: Create `maxConcurrency` number of DO instances, and ensure they each have an alarm set at `maxBatchTimeout`
  }

  async queue {

  }

  
    
}

export class KafkaConsumer {
  constructor(ctx, env) {
    // Create alarms based on the settings
  }

  async fetch(req) {
    
  }

  async alarm() {
    
  }
}

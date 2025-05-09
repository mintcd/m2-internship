import { Worker, MessageChannel } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import { tag, send, receive, goto, end } from "../src/SessionType.ts";
import { DataType, int } from '../src/DataType.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Frame = new DataType({ data: { header: int, data: int }, name: 'Frame' });
const Ack = new DataType({ data: { header: int }, name: 'Ack' });

function runMain(log = false) {
  const serverType =
    tag('S')
      .send(Frame)
      .offer({
        ack: receive(Ack).select({
          continue: goto('S'),
          end: end()
        }),
        unack: goto('S')
      });

  const { port1, port2 } = new MessageChannel();

  const server = new Worker(path.resolve(__dirname, './server.ts'));
  const client = new Worker(path.resolve(__dirname, './client.ts'));


  server.postMessage({ type: 'init', sessionType: serverType, port: port1 }, [port1]);
  client.postMessage({ type: 'init', sessionType: serverType.dual(), port: port2 }, [port2]);

  // Optional logging to observe messages
  if (log) {
    server.on('message', msg => console.log('Server -> Main:', msg));
    client.on('message', msg => console.log('Client -> Main:', msg));
  }
}

runMain();

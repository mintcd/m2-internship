import { parentPort } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import SessionType from '../src/SessionType.ts';
import Channel from '../src/Channel.ts';
import { fileURLToPath } from 'url';

let logs = "";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.join(__dirname, 'server.log');

parentPort!.once('message', async ({ sessionType, port }) => {
  const st = new SessionType(sessionType.sequence, sessionType.tagDict, true);
  logs += "Session type: " + st.toString({ indent: 1 }) + "\n";

  const queue: number[] = [1, 2, 3];
  const channel = new Channel(st, port);

  try {
    while (true) {
      await channel.send(queue[0]);
      logs += `Sent: ${queue[0]}\n`;

      const branch = await channel.offer();
      logs += `Offered: received branch '${branch}'\n`;

      if (branch === 'ack') {
        const ack = await channel.receive();
        logs += `Received ack: ${ack}\n`;
        queue.shift();

        if (queue.length > 0) {
          await channel.select('continue')
          logs += `Selected: continue\n`;
        } else {
          await channel.select('end')
          logs += `Selected: end\n`;
          await channel.end()
          logs += `Ended\n`;
          break
        }
      }
    }
  } catch (err) {
    logs += `Error: ${err instanceof Error ? err.message : String(err)}\n`;
  } finally {
    fs.writeFileSync(logPath, logs);
  }
});

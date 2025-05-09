import { parentPort } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import SessionType from '../src/SessionType.ts';
import Channel from '../src/Channel.ts';
import { fileURLToPath } from 'url';

let logs = "";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.join(__dirname, 'client.log');

parentPort!.once('message', async ({ sessionType, port }) => {
  const st = new SessionType(sessionType.sequence, sessionType.tagDict, true);
  logs += "Session type: " + st.toString() + "\n";
  const channel = new Channel(st, port);

  try {
    while (true) {
      const message = await channel.receive();
      logs += `Received: ${message}\n`;

      await channel.select('ack')
      logs += `Selected: ack\n`;

      await channel.send(message)
      logs += `Sent: ${message}\n`;

      const branch = await channel.offer();
      logs += `Offered: received branch '${branch}'\n`;

      if (branch === 'end') {
        await channel.end()
        logs += `Ended\n`;
        break
      }
    }
  } catch (err) {
    logs += `Error: ${err}\n`;
  } finally {
    fs.writeFileSync(logPath, logs);
  }
});


import { MessageChannel } from 'worker_threads';

const { port1, port2 } = new MessageChannel();

port1.on('message', (message) => {
  console.log('Port 1 received', message);
  port1.postMessage('Port 1: Goodbye');
  port1.close();
});

port2.on('message', (message) => {
  console.log('Port 2 received', message);
  port2.close();
});

port2.postMessage('Port 2: Hello');

port1.addEventListener('close', () => {
  console.log('Port 1 closed');
});



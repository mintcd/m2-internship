import { parentPort } from 'worker_threads';

parentPort.on('message', ({ port, name }) => {
  port.onmessage = (event) => {
    console.log(`Worker ${name} got:`, event.data);
    if (event.data === 'ping') {
      port.postMessage('pong');
    } else if (event.data === 'pong') {
      port.postMessage('ping');
    }
  };

  // Only one worker should initiate
  if (name === 'A') {
    port.postMessage('ping');
  }
});

const yawl = require('../../dist/index').default;

const server = new yawl.Server({port: 2345});

server.on('connection', (ws) => {
  setTimeout(() => {
    ws.send("Hello world");
  }, 2000);
  ws.on('message', (message) => {
    console.log(message);
    ws.send("I can hear you!");
  });
})
import Server from '../src/Server';
import http from './__mocks__/http';
import FrameSender from '../src/FrameSender';

describe('Server receive message', () => {
  test('receive text message', () => {
    const server = new http.Server();
    const wss = new Server({server});
    wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        expect(message.toString()).toBe(msg);
      })
    });


    const socket = server.emitUpgrade();
    const sender = new FrameSender(socket);
    const msg = "Hello world";
    sender.send(msg);
  });

  test('receive binary message', () => {
    const server = new http.Server();
    const wss = new Server({server});
    wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        expect(message).toEqual(binary);
      })
    });

    const socket = server.emitUpgrade();
    const binary = Buffer.from('binary');
    const sender = new FrameSender(socket);
    sender.send(binary);
  });
});

describe('Server send message', () => {
});



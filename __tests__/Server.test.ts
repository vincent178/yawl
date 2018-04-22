import Server from '../src/Server';
import http from './__mocks__/http';
import FrameUtil from '../src/FrameUtil';

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
    const msg = "Hello world";
    const buf = FrameUtil.build({
      data: msg,
      fin: true,
      opcode: 1,
      mask: true
    });
    socket.send(buf);
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
    const buf = FrameUtil.build({
      data: binary,
      fin: true,
      opcode: 2,
      mask: true
    })
    socket.send(buf);
  });
});

describe('Server send message', () => {
});



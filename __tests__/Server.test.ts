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

    socket.send(FrameUtil.build({
      fin: true,
      opcode: 1,
      mask: false,
      data: msg
    }))
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

    socket.send(FrameUtil.build({
      fin: true,
      opcode: 2,
      mask: false,
      data: binary
    }))
  });
});

describe('Server send message', () => {
});



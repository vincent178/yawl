import Server from '../src/Server';
import http from './__mocks__/http';
import FrameUtil from '../src/FrameUtil';

const server = new http.Server();

describe('Server receive message', () => {
  test('receive text message', () => {
    const wss = new Server({server});
    const socket = server.emitUpgrade();
    const msg = "Hello world";

    socket.send(FrameUtil.build({
      fin: true,
      opcode: 1,
      mask: false,
      data: msg
    }))

    wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        expect(message).toBe(msg);
      })
    });
  });

  test('receive binary message', () => {
    const wss = new Server({server});
    const socket = server.emitUpgrade();
    const binary = Buffer.from('binary');

    // socket.send(FrameUtil.build({
    //   fin: true,
    //   opcode: 2,
    //   mask: false,
    //   data: binary
    // }))

    // wss.on('connection', (ws) => {
    //   ws.on('message', (message) => {
    //     expect(binary.equals(message)).toBe(true);
    //   })
    // });
  });
});

describe('Server send message', () => {
});



import * as sinon from 'sinon';
import Server from '../src/Server';
import http from './__mocks__/http';
import Util from '../src/Util';

describe('Server receive message', () => {
  test('receive text message', () => {
    const spy = sinon.spy();
    const server = new http.Server();
    const wss = new Server({server});
    wss.on('connection', (ws) => {
      spy();
      ws.on('message', (message) => {
        spy();
        expect(message.toString()).toBe(msg);
      })
    });


    const socket = server.emitUpgrade();
    const msg = "Hello world";
    const buf = Util.frame({
      data: msg,
      fin: true,
      opcode: 1,
      mask: true
    });
    socket.send(buf);
    expect(spy.callCount).toBe(2);
  });

  test('receive binary message', () => {
    const spy = sinon.spy();
    const server = new http.Server();
    const wss = new Server({server});
    wss.on('connection', (ws) => {
      spy();
      ws.on('message', (message) => {
        spy();
        expect(message).toEqual(binary);
      })
    });

    const socket = server.emitUpgrade();
    const binary = Buffer.from('binary');
    const buf = Util.frame({
      data: binary,
      fin: true,
      opcode: 2,
      mask: true
    })
    socket.send(buf);
    expect(spy.callCount).toBe(2);
  });
});

describe('Server send message', () => {
});



import * as EventEmitter from 'events';
import net from './net';
const http = <any>jest.genMockFromModule('http');

class Server extends EventEmitter {
  emitUpgrade() {
    const socket = new net.Socket()
    const req = {
      method: 'GET',
      httpVersion: '1.1',
      headers: {
        host: 'test.com',
        upgrade: 'websocket',
        connection: 'Upgrade',
        origin: 'test.com',
        'sec-websocket-key': '123',
        'sec-websocket-version': '13'
      }
    };
    this.emit('upgrade', req, socket);
    return socket;
  }
}

http.Server = Server;

export default http;
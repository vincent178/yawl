import * as EventEmitter from 'events';
import net from './net';
const http = <any>jest.genMockFromModule('http');

class Server extends EventEmitter {
  emitUpgrade() {
    const socket = new net.Socket()
    const req = {
      headers: {}
    };
    socket.id = Math.floor(Math.random() * 100); 
    this.emit('upgrade', req, socket);
    return socket;
  }
}

http.Server = Server;

export default http;
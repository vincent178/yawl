import * as EventEmitter from 'events';
const net = <any>jest.genMockFromModule('net');

function noop() {};
class Socket extends EventEmitter {

  write() {
  };

  send(message) {
    this.emit('data', message);
  }
}

net.Socket = Socket;

export default net;
import * as EventEmitter from 'events';
import * as net from 'net';
import Sender from './Sender';
import Receiver from './Receiver';

/* 
 * 
 *  WebSocket class
 *    * parse data frame to message
 *    * build server send data frame 
 * 
 *  WebSocket Framing Protocol
 *      0                   1                   2                   3
 *   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 *  +-+-+-+-+-------+-+-------------+-------------------------------+
 *  |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
 *  |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
 *  |N|V|V|V|       |S|             |   (if payload len==126/127)   |
 *  | |1|2|3|       |K|             |                               |
 *  +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
 *  |     Extended payload length continued, if payload len == 127  |
 *  + - - - - - - - - - - - - - - - +-------------------------------+
 *  |                               |Masking-key, if MASK set to 1  |
 *  +-------------------------------+-------------------------------+
 *  | Masking-key (continued)       |          Payload Data         |
 *  +-------------------------------- - - - - - - - - - - - - - - - +
 *  :                     Payload Data continued ...                :
 *  + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
 *  |                     Payload Data continued ...                |
 *  +---------------------------------------------------------------+
 * 
 *  TODO: <v1.0> refactor to universal purpose
 *  TODO: <v1.0> different packages for client and server and universal
 */
export default class WebSocket extends EventEmitter {

  private _socket: net.Socket;
  private _head: Buffer;
  private _sender: Sender;
  private _receiver: Receiver;

  constructor(socket: net.Socket, head: Buffer) {
    super();
    this._socket = socket;
    this._head = head;
    this._sender = new Sender(socket);
    this._receiver = new Receiver();


    this._receiver.on('message', (message) => {
      this.emit('message', message);
    });

  }

  send(data: string|Buffer) {
    this._sender.send(data);
  }

  ping(data?: string|Buffer) {
    this._sender.ping(data);
  }

  pong(data?: string|Buffer) {
    this._sender.pong(data);
  }

  close(code?: number, reason?: string) {
    this._sender.close(code, reason);
  }

  onData(buf: Buffer) {
    if (!this._receiver.write(buf)) {
      this._socket.pause();
    }
  }
}

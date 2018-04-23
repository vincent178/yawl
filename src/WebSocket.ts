import * as EventEmitter from 'events';
import * as net from 'net';
import Sender from './Sender';
import Receiver from './Receiver';

/* 
 *  WebSocket class
 *    * parse data frame to message
 *    * build server send data frame 
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

    this._receiver.on('message', (message) => this.receiverOnMessage(message));
    this._receiver.on('ping', () => this.receiverOnPing());
    this._receiver.on('pong', () => this.receiverOnPong());
    this._receiver.on('conclude', () => this.receiverOnConclude());
    this._receiver.on('drain', () => this.receiverOnDrain());

    this._socket.on('close', () => this.socketOnClose());
    this._socket.on('data', (buf) => this.socketOnData(buf));
    this._socket.on('end', () => this.socketOnEnd());
    this._socket.on('error', () => this.socketOnError());
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

  private receiverOnConclude() {
  }

  private receiverOnDrain() {
  }

  private receiverOnMessage(message: Buffer|string) {
    this.emit('message', message);
  }

  private receiverOnPing() {
  }

  private receiverOnPong() {
  }

  private socketOnClose() {
  }

  private socketOnData(buf: Buffer) {
    if (!this._receiver.write(buf)) {
      this._socket.pause();
    }
  }

  private socketOnEnd() {
  }

  private socketOnError() {
  }
}

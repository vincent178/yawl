import * as EventEmitter from 'events';
import * as net from 'net';
import Sender from './Sender';
import Receiver from './Receiver';

const CLOSE_TIMEOUT = 30 * 1000; // Allow 30 seconds to terminate the connection cleanly.

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
  private _sender: Sender;
  private _receiver: Receiver;
  private _closeTimer: any;

  constructor(socket: net.Socket, head: Buffer) {
    super();
    this._socket = socket;
    this._sender = new Sender(socket);
    this._receiver = new Receiver();

    this._receiver.on('message', this.receiverOnMessage);
    this._receiver.on('ping', this.receiverOnPing);
    this._receiver.on('pong', this.receiverOnPong);
    this._receiver.on('close', this.receiverOnClose);

    if (typeof head !== 'undefined' && head.length > 0) {
      socket.unshift(head);
    }

    this._socket.on('close', this.socketOnClose);
    this._socket.on('data', this.socketOnData);

    this.emit('open');
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

  private receiverOnClose = (code?: number, reason?: string) => {
    this.emitClose(code, reason);

    this._sender.close(code, reason, (err: Error) => {
      if (err) return;

      this._closeTimer = setTimeout(() => this._socket.destroy(), CLOSE_TIMEOUT);
    });
  }

  private receiverOnMessage = (message: Buffer|string) => {
    this.emit('message', message);
  }

  private receiverOnPing = (data: any) => {
    this.emit('ping', data);
  }

  private receiverOnPong = (data: any) => {
    this.emit('pong', data);
  }

  private socketOnClose = () => {
    this._socket.removeListener('close', this.socketOnClose);
    this._socket = <any>null;

    clearTimeout(this._closeTimer);

    this.emitClose();
  }

  private socketOnData = (buf: Buffer) => {
    this._receiver.receive(buf);
  }

  private emitClose(code?: number, reason?: string) {
    this._receiver.removeAllListeners();

    this.emit('close', code, reason);
  }
}

import * as EventEmitter from 'events';
import * as http from 'http';
import * as net from 'net';
import * as crypto from 'crypto';
import * as fs from 'fs';
import WebSocket from './WebSocket';


export default class Server extends EventEmitter {

  constructor() {
    super();
  }
}


const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
});

server.on('upgrade', (req: http.IncomingMessage, socket: net.Socket, head: Buffer) => {

  const key = req.headers['sec-websocket-key'];
  let accept;
  
  if (key && typeof key !== 'undefined') {
    accept = webSocketAccept(key as string);
  }

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: webSocket\r\n' +
    'Connection: upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n` + 
    '\r\n'
  );

  const ws = new WebSocket(socket, head);

  socket.on('data', buf => {
    ws.onData(buf)
    fs.readFile('/Users/i312714/Downloads/2018-02-07_14-03-03.mp4', (err, data) => {
      if (err) {
        throw err;
      }
      console.log(data.length);
      // ws.send('hello world');
      ws.send(data);
    });
  });
});

function webSocketAccept(key: string): string {
  const hash = crypto.createHash('sha1');
  hash.update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
  return hash.digest('base64');
}


server.listen(2345, () => {
  console.log("server started at 2345");
});
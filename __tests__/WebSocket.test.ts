import WebSocket from '../src/WebSocket';
import net from './__mocks__/net';

const socket = new net.Socket();

const ws = new WebSocket(socket, null);


test('WebSocket consume', () => {
  const data = 'Hello world';
  ws['_buffers'] = Buffer.from(data);

  const sub = ws.consume(2);

  expect(sub.length).toBe(2);
  expect(ws.buffers.length).toBe(9);
  expect(Buffer.concat([sub, ws.buffers]).toString()).toBe(data);
});

test('WebSocket getInfo', () => {
  const data = 'Hello world';
  ws['_buffers'] = Buffer.from(data);
});
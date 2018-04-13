
export default interface Frame {
  fin: boolean;
  opcode: number;
  mask: boolean;
  payloadLen: number;
  maskingKey?: Buffer;
  payloadData: Buffer;
}
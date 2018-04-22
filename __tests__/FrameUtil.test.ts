import FrameUtil from '../src/FrameUtil';

describe('FrameUtil test', () => {
  test('can mask and unmask message', () => {
    const msg = "Hello worlde";
    const keyBuf = Buffer.allocUnsafe(4);
    keyBuf.write("this is key");
    const maskedMsg = FrameUtil.maskOrUnmask(keyBuf, Buffer.from(msg));
    const unmaskedMsg = FrameUtil.maskOrUnmask(keyBuf, maskedMsg);
    expect(unmaskedMsg.toString()).toBe(msg);
  });
});
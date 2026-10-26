import { randomInt } from "node:crypto";

// No 0/O/1/I to avoid confusion when read over the phone.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function code(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

const year = () => new Date().getFullYear();

export const newInquiryRef = () => `ENQ-${year()}-${code(6)}`;
export const newBookingRef = () => `NAB-${year()}-${code(6)}`;
export const newReceiptNo = () => `RCT-${year()}-${code(6)}`;
export const newOnlinePaymentRef = () => `PAY-${year()}-${code(10)}`;

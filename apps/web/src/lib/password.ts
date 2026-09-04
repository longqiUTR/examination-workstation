// Node 内置 scrypt 做密码 hash（避免引入 bcrypt 依赖）。
// scrypt 是 Node crypto 标准 API,不需要额外装包,慢哈希抗暴力破解。

import { scrypt as scryptCb, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

// 格式: "scrypt$N$r$p$saltBase64$hashBase64"
const N = 16384; // CPU/内存成本
const r = 8;
const p = 1;
const KEY_LEN = 64;
const SALT_LEN = 16;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const hash = await scrypt(plain, salt, KEY_LEN);
  return [
    "scrypt",
    N,
    r,
    p,
    salt.toString("base64"),
    hash.toString("base64"),
  ].join("$");
}

export async function verifyPassword(
  plain: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const saltB64 = parts[4];
  const hashB64 = parts[5];
  if (!saltB64 || !hashB64) return false;
  const salt = Buffer.from(saltB64, "base64");
  const target = Buffer.from(hashB64, "base64");
  const actual = await scrypt(plain, salt, target.length);
  if (actual.length !== target.length) return false;
  return timingSafeEqual(actual, target);
}

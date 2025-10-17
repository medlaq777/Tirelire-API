import Crypto from "../../utils/crypto";
import fs from "node:fs/promises";
import path from "node:path";
import Config from "../../config/config.js";

describe("Crypto Utility", () => {
  const testDir = path.resolve(__dirname, "test-uploads");
  const testKey = "a".repeat(64);
  let cryptoUtil;
  let originalKey;

  beforeAll(() => {
    originalKey = Config.fileEncryptionKey;
    Config.fileEncryptionKey = testKey;
    cryptoUtil = new Crypto(testDir);
  });

  afterAll(async () => {
    Config.fileEncryptionKey = originalKey;
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("should encrypt and decrypt a buffer", async () => {
    const buffer = Buffer.from("hello world");
    const meta = await cryptoUtil.encryptAndSave(buffer);
    expect(meta.filename.endsWith(".enc")).toBe(true);
    expect(meta.iv).toHaveLength(24);
    expect(meta.authTag).toHaveLength(32);
    expect(meta.path).toContain(testDir);

    const decrypted = await cryptoUtil.decryptFromFileMeta(meta);
    expect(decrypted.toString()).toBe("hello world");
  });

  it("should create storage directory if not exists", async () => {
    const dir = path.resolve(__dirname, "another-dir");
    const util = new Crypto(dir);
    await util.ensureDir();
    const stat = await fs.stat(dir);
    expect(stat.isDirectory()).toBe(true);
    await fs.rm(dir, { recursive: true, force: true });
  });
});

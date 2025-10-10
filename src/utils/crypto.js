import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import Config from "../config/config";

class Crypto {
  constructor(storageDir = path.resolve(__dirname, "../../secure_storage")) {
    this.storageDir = storageDir;
  }

  async esureDir() {
    await fs.mkdir(this.storageDir, { recursive: true });
  }

  async ecryptAndSave(buffer) {
    await this.esureDir();
    const key = Buffer.from(Config.fileEncryptionKey, "hex");
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const filename = `${uuidv4()}.enc`;
    const filepath = path.join(this.storageDir, filename);

    await fs.writeFile(filepath, encrypted);
    return {
      filename,
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
      path: filepath,
    };
  }

  async decryptFromFileMeta(meta) {
    const key = Buffer.from(Config.fileEncryptionKey, "hex");
    const { path: filepath, iv, authTag } = meta;
    const cipherText = await fs.readFile(filepath);
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTag, "hex"));
    const decrypted = Buffer.concat([
      decipher.update(cipherText),
      decipher.final(),
    ]);
    return decrypted;
  }
}

module.exports = Crypto;

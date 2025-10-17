import JwtUtils from "../../utils/jwt";
import config from "../../config/config.js";

describe("JwtUtils", () => {
  const testPayload = { userId: "123", role: "admin" };
  const testSecret = "testsecret";
  const testExpiresIn = "1h";
  let originalSecret, originalExpiresIn;

  beforeAll(() => {
    originalSecret = config.jwtSecret;
    originalExpiresIn = config.jwtExpiresIn;
    config.jwtSecret = testSecret;
    config.jwtExpiresIn = testExpiresIn;
  });

  afterAll(() => {
    config.jwtSecret = originalSecret;
    config.jwtExpiresIn = originalExpiresIn;
  });

  it("should generate and verify a token", () => {
    const token = JwtUtils.generateToken(testPayload);
    expect(typeof token).toBe("string");
    const decoded = JwtUtils.verifyToken(token);
    expect(decoded.userId).toBe(testPayload.userId);
    expect(decoded.role).toBe(testPayload.role);
  });

  it("should throw error for invalid token", () => {
    expect(() => JwtUtils.verifyToken("invalid.token")).toThrow();
  });
});

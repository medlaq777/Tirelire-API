import { jest, describe, it, expect, beforeEach } from "@jest/globals";

import bcrypt from "bcryptjs";
import jwt from "../utils/jwt.js";
import AuthService from "../services/auth.service.js";

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("../utils/jwt.js", () => ({
  generateToken: jest.fn(),
}));

const mockUserRepo = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  AuthService.userRepo = mockUserRepo;
});

describe("AuthService.register", () => {
  const userData = {
    fullName: "hassan habchakalat",
    email: "hassan@test.com",
    password: "hassan@test.com",
  };
  const mockCreatedUser = {
    ...userData,
    id: "123",
    password: "hassan@test.com",
    toObject: () => ({
      ...userData,
      id: "123",
      password: "hassan@test.com",
      __v: 0,
    }),
  };
  const mockToken = "mocked-jwt-token";
  it("throw 400 error if email or password is missing", async () => {
    await expect(
      AuthService.register({
        fullName: "Test",
        email: "a@b.com",
        password: "",
      })
    ).rejects.toMatchObject({
      status: 400,
      message: "Email and Password are required",
    });
    expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
  });

  it("throw 409 error if user already exists", async () => {
    AuthService.userRepo = mockUserRepo;
    mockUserRepo.findByEmail.mockResolvedValueOnce(mockCreatedUser);
    await expect(AuthService.register(userData)).rejects.toMatchObject({
      status: 409,
      message: "User already exists",
    });
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(userData.email);
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });
  it("successfully regiser new user and return user token", async () => {
    AuthService.userRepo = mockUserRepo;
    mockUserRepo.findByEmail.mockResolvedValueOnce(null);
    bcrypt.hash.mockResolvedValue("hassan@test.com");
    mockUserRepo.create.mockResolvedValue(mockCreatedUser);
    jwt.generateToken.mockReturnValue(mockToken);
    const result = await AuthService.register(userData);
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(userData.email);
    expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
    expect(mockUserRepo.create).toHaveBeenCalledWith({
      fullName: userData.fullName,
      email: userData.email,
      password: "hassan@test.com",
    });
    expect(jwt.generateToken).toHaveBeenCalledWith({
      id: mockCreatedUser.id,
      fullName: mockCreatedUser.fullName,
      email: mockCreatedUser.email,
    });
    expect(result.token).toBe(mockToken);
    expect(result.user).toEqual({
      id: "123",
      fullName: userData.fullName,
      email: userData.email,
    });
  });
});

describe("AuthService.login", () => {
  const userData = {
    email: "hassan@test.com",
    password: "hassan@test.com",
  };
  const mockUser = {
    id: "123",
    email: userData.email,
    password: "hassan@test.com",
    toObject: () => ({
      id: "123",
      email: userData.email,
      password: "hassan@test.com",
      __v: 0,
    }),
  };
  const mockToken = "mocked-jwt-token";
  it("throw 400 error if email or password is missing", async () => {
    await expect(
      AuthService.login({ email: "a@b.com", password: "" })
    ).rejects.toMatchObject({
      status: 400,
      message: "Email and Password are required",
    });
    expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
  });

  it("throw 401 error if user is not found", async () => {
    mockUserRepo.findByEmail.mockResolvedValueOnce(null);
    await expect(AuthService.login(userData)).rejects.toMatchObject({
      status: 401,
      message: "Invalid email or password",
    });
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(userData.email);
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("throw 401 error if password does not match", async () => {
    mockUserRepo.findByEmail.mockResolvedValueOnce(mockUser);
    bcrypt.compare.mockResolvedValue(false);
    await expect(AuthService.login(userData)).rejects.toMatchObject({
      status: 401,
      message: "Invalid email or password",
    });
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(userData.email);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      userData.password,
      mockUser.password
    );
    expect(jwt.generateToken).not.toHaveBeenCalled();
  });
  it("Successfully login and return User Token", async () => {
    mockUserRepo.findByEmail.mockResolvedValueOnce(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.generateToken.mockReturnValue(mockToken);

    const result = await AuthService.login(userData);

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(userData.email);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      userData.password,
      mockUser.password
    );
    expect(jwt.generateToken).toHaveBeenCalledWith({
      id: mockUser.id,
      email: mockUser.email,
    });
    expect(result.token).toBe(mockToken);
    expect(result.user).toEqual({ id: "123", email: userData.email });
  });
});

describe("AuthService.profile", () => {
  const userId = "123";
  const mockUser = {
    id: userId,
    email: "hassan@test.com",
    password: "hassan@test.com",
    toObject: () => ({
      id: userId,
      email: "hassan@test.com",
      password: "hassan@test.com",
      __v: 0,
    }),
  };
  it("throw 404 error if user not found", async () => {
    mockUserRepo.findById.mockResolvedValueOnce(null);
    await expect(AuthService.profile(userId)).rejects.toMatchObject({
      status: 404,
      message: "User not found",
    });
    expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
  });
  it("Successfully return user profile", async () => {
    mockUserRepo.findById.mockResolvedValueOnce(mockUser);
    const result = await AuthService.profile(userId);
    expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
    expect(result).toEqual({ id: userId, email: mockUser.email });
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("__v");
  });
});

describe("AuthService.sanitize", () => {
  it("removes password and __v from user object with toObject", () => {
    const user = {
      toObject: () => ({
        id: "1",
        email: "a@b.com",
        password: "secret",
        __v: 0,
      }),
    };
    const result = AuthService.sanitize(user);
    expect(result).toEqual({ id: "1", email: "a@b.com" });
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("__v");
  });

  it("removes password and __v from plain user object", () => {
    const user = { id: "2", email: "b@b.com", password: "pw", __v: 1 };
    const result = AuthService.sanitize(user);
    expect(result).toEqual({ id: "2", email: "b@b.com" });
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("__v");
  });

  it("returns empty object if user is null or undefined", () => {
    expect(AuthService.sanitize(null)).toEqual({});
    expect(AuthService.sanitize(undefined)).toEqual({});
  });
});

describe("AuthService.sanitize edge cases", () => {
  it("returns object unchanged if password and __v are missing", () => {
    const user = { id: "3", email: "c@b.com" };
    const result = AuthService.sanitize(user);
    expect(result).toEqual({ id: "3", email: "c@b.com" });
  });

  it("returns empty object if input is not an object", () => {
    expect(AuthService.sanitize(42)).toEqual({});
    expect(AuthService.sanitize("string")).toEqual({});
  });
});

describe("AuthService constructor", () => {
  // Skipped: AuthService is a singleton, not a class export
});

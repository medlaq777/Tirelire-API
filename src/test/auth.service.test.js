import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
} from "@jest/globals";

jest.unstable_mockModule("bcryptjs", () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

jest.unstable_mockModule("../utils/jwt.js", () => ({
  default: {
    generateToken: jest.fn(),
  },
}));

let AuthService;
let bcrypt;
let jwt;
const mockUserRepo = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
};

beforeAll(async () => {
  const bcryptMod = await import("bcryptjs");
  bcrypt = bcryptMod.default || bcryptMod;
  const jwtMod = await import("../utils/jwt.js");
  jwt = jwtMod.default || jwtMod;
  const authMod = await import("../services/auth.service.js");
  AuthService = authMod.default;
});

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
    password: "hashed_password",
    toObject: () => ({
      ...userData,
      id: "123",
      password: "hashed_password",
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
    bcrypt.hash.mockResolvedValue("hashed_password");
    mockUserRepo.create.mockResolvedValue(mockCreatedUser);
    jwt.generateToken.mockReturnValue(mockToken);
    const result = await AuthService.register(userData);
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(userData.email);
    expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
    expect(mockUserRepo.create).toHaveBeenCalledWith({
      fullName: userData.fullName,
      email: userData.email,
      password: "hashed_password",
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
    password: "hashed_password",
    toObject: () => ({
      id: "123",
      email: userData.email,
      password: "hashed_password",
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

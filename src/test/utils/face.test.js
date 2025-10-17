import Face from "../../utils/face";

describe("Face Utility", () => {
  let face;
  beforeAll(() => {
    face = new Face("dummy-models-path");
  });

  it("should calculate euclidean distance", () => {
    const d1 = [1, 2, 3];
    const d2 = [4, 5, 6];
    const dist = Face.euclideanDistance(d1, d2);
    expect(dist).toBeCloseTo(Math.sqrt(27));
  });

  it("should return null if getDescriptor fails (mock)", async () => {
    face.loadModels = jest.fn();
    face.bufferToImage = jest.fn();
    // Mock faceapi to return null
    const mockDetect = jest.fn().mockReturnValue({
      withFaceLandmarks: () => ({ withFaceDescriptor: () => null }),
    });
    jest
      .spyOn(require("face-api.js"), "detectSingleFace")
      .mockImplementation(mockDetect);
    const result = await face.getDescriptor(Buffer.from(""));
    expect(result).toBeNull();
  });

  it("should return match=false if face not detected (mock)", async () => {
    face.getDescriptor = jest.fn().mockResolvedValue(null);
    const result = await face.compareImages(Buffer.from("a"), Buffer.from("b"));
    expect(result.match).toBe(false);
    expect(result.reason).toBe("face_not_detected");
  });
});

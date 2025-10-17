import path from "node:path";
import * as canvasModule from "canvas";
import * as faceapi from "face-api.js";
const { Canvas, Image, ImageData } = canvasModule;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

class Face {
  constructor(modelsPath) {
    const defaultModelsPath = path.resolve(
      process.cwd(),
      "src",
      "models",
      "faceapi"
    );
    this.modelsPath = modelsPath || defaultModelsPath;
    this._loaded = false;
  }

  async loadModels() {
    if (this._loaded) return;
    await faceapi.nets.tinyFaceDetector.loadFromDisk(this.modelsPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelsPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelsPath);

    this._loaded = true;
  }

  bufferToImage(buffer) {
    return canvasModule.loadImage(buffer);
  }

  async getDescriptor(buffer) {
    await this.loadModels();
    const img = await this.bufferToImage(buffer);
    const detections = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) return null;
    return detections.descriptor;
  }

  static euclideanDistance(d1, d2) {
    let sum = 0;
    for (let i = 0; i < d1.length; i++) {
      const diff = d1[i] - d2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  async compareImages(bufA, bufB, threshold = 0.6) {
    const descA = await this.getDescriptor(bufA);
    const descB = await this.getDescriptor(bufB);
    if (!descA || !descB)
      return { match: false, distance: null, reason: "face_not_detected" };
    const distance = Face.euclideanDistance(descA, descB);
    const match = distance <= threshold;
    return { match, distance };
  }
}

export default Face;

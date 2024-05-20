import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/Addons.js';
import {Models} from "../configs/models.ts";

export async function loadModel(model: Models): Promise<THREE.Group<THREE.Object3DEventMap>> {
  return new Promise((resolve, reject) => {
    const fbxLoader = new FBXLoader();
    fbxLoader.load(model, (object: THREE.Group<THREE.Object3DEventMap>) => {
      // object.position.set(0, 2, 0);
      // object.scale.set(.01, .03, .01);
      resolve(object);
    }, (xhr: any) => {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    }, (error: any) => {
      reject(error);
    });
  });
}

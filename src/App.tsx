import './App.css';
import {useEffect, useRef} from "react";
import * as THREE from 'three';
import {SRGBColorSpace} from 'three';
import {loadModel} from "./lib/three/utils/loader.ts";
import {Models} from "./lib/three/configs/models.ts";
import {OrbitControls} from 'three/examples/jsm/Addons.js';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;

function App() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    let INTERSECTED;

    // Light setup
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 100, -8); // Adjusted for better shadow casting
    light.castShadow = true; // Enable shadow casting for the light
    light.shadow.mapSize.width = 2048; // Increased for better quality shadows
    light.shadow.mapSize.height = 2048; // Increased for better quality shadows
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;
    light.shadow.camera.left = -50;
    light.shadow.camera.right = 50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;
    scene.add(light);

    scene.add(new THREE.AmbientLight(0xffffff, 2));

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      CANVAS_WIDTH / CANVAS_HEIGHT,
      0.1,
      1000
    );
    camera.zoom = 2.4;
    camera.position.set(12, 68, 10);
    camera.lookAt(10, 60, 8);
    camera.updateProjectionMatrix();

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.shadowMap.enabled = true; // Enable shadow mapping
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    ref.current?.appendChild(renderer.domElement);

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.enableDamping = true;
    controls.screenSpacePanning = true;
    controls.target.set(9, 59, 8);
    const logCameraPosition = () => {
      console.log('Camera Position:', camera.position);
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const currentTargetPosition = new THREE.Vector3().copy(camera.position).add(direction.multiplyScalar(10)); // Assuming a distance of 10

      console.log('Camera Look At:', currentTargetPosition);
    };

    controls.addEventListener('change', logCameraPosition);

    // Create a ground plane to receive shadows
    const groundGeometry = new THREE.CircleGeometry(20, 40);
    const planeMaterial = new THREE.MeshPhongMaterial({color: 0x000000});
    const ground = new THREE.Mesh(groundGeometry, planeMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true; // Enable receiving shadows for the ground
    scene.add(ground);

    let objectsMap = [];
    loadModel(Models.NorthStudio).then(object => {
      object.position.set(-1.3, 40, 0);
      object.scale.set(0.03, 0.02, 0.03);
      object.traverse(node => {
        node.castShadow = true;
        if (node instanceof THREE.Mesh) {
          node.material.color.setHex(0xffffff);
        }
      });
      scene.add(object);
      objectsMap.push({
        object,
        originalPosition: object.position,
        animateXLimit: 0.01,
        animateYLimit: 0.025,
        animateZLimit: 0.002,
        rotateZLimit: 0.3,
        animateTime: 3,
      });
    });

    loadModel(Models.NorthStudio).then(object => {
      object.position.set(-3, 34, .4);
      object.scale.set(0.06, 0.08, 0.06);
      object.traverse(node => {
        node.castShadow = true;
        node.receiveShadow = true;
        if (node instanceof THREE.Mesh) {
          node.material.color.setHex(0xcccccc);
        }
      });
      scene.add(object);
      objectsMap.push({
        object,
        originalPosition: object.position,
        animateXLimit: 0.015,
        animateYLimit: 0.02,
        animateZLimit: -0.008,
        rotateZLimit: -0.08,
        animateTime: 5,
      });
    });

    loadModel(Models.NorthStudio).then(object => {
      object.position.set(1.5, 39, 2);
      object.scale.set(0.02, 0.08, 0.02);
      object.traverse(node => {
        node.castShadow = true;
        node.receiveShadow = true;
        if (node instanceof THREE.Mesh) {
          node.material.color.setHex(0xdddddd);
        }
      });
      scene.add(object);
      objectsMap.push({
        object,
        originalPosition: object.position,
        animateXLimit: 0.015,
        animateYLimit: 0.02,
        animateZLimit: -0.01,
        rotateZLimit: -0.2,
        animateTime: 3,
      });
    });

    const clock = new THREE.Clock();
    const rayCaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event: any) => {
      mouse.x = (event.clientX / CANVAS_WIDTH) * 2 - 1;
      mouse.y = -(event.clientY / CANVAS_HEIGHT) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove, false);

    const animate = () => {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      for (let item of objectsMap) {
        const model = item.object;
        const originalPosition = item.originalPosition;
        // Move model slightly based on original position
        model.position.y = originalPosition.y + Math.sin(time * item.animateTime) * item.animateYLimit; // Up and down (reduced)
        model.position.x = originalPosition.x + Math.sin(time * item.animateTime) * item.animateXLimit; // Left and right (reduced)
        model.position.z = originalPosition.z + Math.sin(time * item.animateTime) * item.animateZLimit; // Left and right (reduced)
        model.rotation.z = Math.sin(time * item.animateTime) * item.rotateZLimit; // Slight rotation (reduced)
      }

      rayCaster.setFromCamera(mouse, camera);
      const intersects = rayCaster.intersectObjects(objectsMap.map(item => item.object), true);

      if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
          if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex); // Reset previous intersection color
          INTERSECTED = intersects[0].object;
          INTERSECTED.currentHex = INTERSECTED.material.color.getHex(); // Store current color
          INTERSECTED.material.color.setHex(0xff0000); // Set new color
        }
      } else {
        if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex); // Reset previous intersection color
        INTERSECTED = null;
      }

      controls.update();
      render();
    };

    const render = () => {
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      ref.current?.removeChild(renderer.domElement);
      controls.dispose();
    };
  }, [ref]);

  return <div ref={ref}></div>;
}

export default App;

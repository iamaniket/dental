/*
 Auther : Aniket Wachakawade
 Date   : 04/04/2022
 For three.js base basic viewer component using React(typescript) 
*/

import React from "react";
import {
  ACESFilmicToneMapping,
  Color,
  PerspectiveCamera,
  PMREMGenerator,
  sRGBEncoding,
} from "three";
import { Box3 } from "three/src/math/Box3";
import { Vector3 } from "three/src/math/Vector3";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import { Scene } from "three/src/scenes/Scene";
import { OrbitControls } from "../lib/OrbitControls.js";
import { GLTFLoader } from "../lib/GLTFLoader";
import RoomEnvironment from "../lib/RoomEnvironment.js";

const loader = new GLTFLoader();

export class Viewer extends React.Component {
  state = {
    allowRotation: false,
  };

  renderer!: WebGLRenderer;

  camera: PerspectiveCamera;
  scene: Scene;
  controls: any;

  constructor(props: {}) {
    super(props);
    this.camera = new PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      10
    );
    this.scene = new Scene();
    this.scene.background = new Color(0x777777);
  }

  componentDidMount() {
    const self = this;

    loader.load(
      "tooth/scene.gltf",
      function (gltf: { scene: Scene }) {
        self.scene.add(gltf.scene);
        self.setIsoView();
      },
      function (xhr: ProgressEvent) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      // called when loading has errors
      function (error: Error) {
        console.log("An error happened");
      }
    );

    // Placeholder for light
    //   const ambientLight = new AmbientLight(0xffffff);
    //   this.scene.add(ambientLight);

    this.renderer = new WebGLRenderer({
      canvas: document.getElementById("viewer-3d") as HTMLCanvasElement,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const pmremGenerator = new PMREMGenerator(this.renderer);
    const environment = new RoomEnvironment();

    this.scene.environment = pmremGenerator.fromScene(environment).texture;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.listenToKeyEvents(window); // optional

    this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 0;
    this.controls.maxDistance = 5000;
    this.controls.maxPolarAngle = Math.PI / 2;

    this.renderer.setAnimationLoop(this.animation.bind(this));
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.outputEncoding = sRGBEncoding;

    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setIsoView() {
    var camera = this.camera;
    let box = new Box3().setFromObject(this.scene);
    if (box === undefined) {
      return;
    }

    var center = new Vector3();
    box.getCenter(center);
    if (center === undefined) {
      return;
    }

    this.controls.reset();
    this.controls.target.copy(center);
    var distance = box.min.distanceTo(box.max);

    var dirVec = new Vector3(1, 1, -1);
    var position = center.clone();
    position.addScaledVector(dirVec.normalize(), distance * 1.2);
    camera.position.set(position.x, position.y, position.z);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }

  animation() {
    this.controls.update();
    if (this.state.allowRotation)
      this.scene.rotation.y = this.scene.rotation.y + 0.01;
    this.renderer.render(this.scene, this.camera);
  }

  render() {
    return (
      <>
        <canvas id="viewer-3d" />
        <button
          className="float-button"
          onClick={() => {
            this.setState({ allowRotation: !this.state.allowRotation });
          }}
        ></button>
      </>
    );
  }
}

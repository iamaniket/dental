/*
 Auther : Aniket Wachakawade
 Date   : 04/04/2022
 For three.js base basic viewer component using React(typescript) 
*/

import React from "react";
import {
  ACESFilmicToneMapping,
  Color,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Raycaster,
  SphereGeometry,
  sRGBEncoding,
  Vector2,
} from "three";
import { Box3 } from "three/src/math/Box3";
import { Vector3 } from "three/src/math/Vector3";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import { Scene } from "three/src/scenes/Scene";
import { OrbitControls } from "../lib/OrbitControls.js";
import { GLTFLoader } from "../lib/GLTFLoader";
import RoomEnvironment from "../lib/RoomEnvironment.js";
import { faRotate } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const loader = new GLTFLoader();

export class Viewer extends React.Component {
  state = {
    allowRotation: false,
  };

  renderer!: WebGLRenderer;
  rayCaster!: Raycaster;

  camera: PerspectiveCamera;
  scene: Scene;
  controls: any;
  pointer: Vector2;
  mouseEvent: any;
  inFoMesh: Array<Mesh>;

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
    this.rayCaster = new Raycaster();
    this.pointer = new Vector2();
    this.inFoMesh = [];
  }

  componentDidMount() {
    const self = this;

    loader.load(
      "tooth/scene.gltf",
      function (gltf: { scene: Scene }) {
        self.scene.add(gltf.scene);
        self.setIsoView();

        const geometry = new SphereGeometry(0.05, 10, 16);
        const material = new MeshPhysicalMaterial({
          color: 0xffff00,
          depthTest: false,
        });
        const info1 = new Mesh(geometry, material);

        info1.name = "This is top of crown";
        const info2 = new Mesh(geometry, material);
        info2.name = "This is midle of crown";
        const info3 = new Mesh(geometry, material);
        info3.name = "This is bottom of crown";

        const box3d = new Box3().setFromObject(gltf.scene);
        info1.position.copy(
          new Vector3(box3d.max.x / 2, box3d.max.y, box3d.max.z / 2)
        );
        info2.position.copy(
          new Vector3(box3d.max.x / 2, box3d.min.y, box3d.max.z / 2)
        );
        info3.position.copy(
          new Vector3(box3d.max.x / 2, box3d.max.y / 2, box3d.max.z / 2)
        );
        self.scene.add(info1);
        self.scene.add(info2);
        self.scene.add(info3);
        self.inFoMesh = [info1, info2, info3];
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
    window.addEventListener("pointermove", this.onPointerMove.bind(this));
  }

  onPointerMove(event: MouseEvent) {
    this.mouseEvent = event;
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

    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components

    if (this.mouseEvent) {
      this.pointer.x = (this.mouseEvent.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(this.mouseEvent.clientY / window.innerHeight) * 2 + 1;

      this.rayCaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.rayCaster.intersectObjects(this.inFoMesh);

      var element = document.getElementById("new");
      if (element) {
        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }
      }

      if (intersects.length > 0) {
        const { object } = intersects[0];
        if (object) {
          var tag = document.createElement("p");
          var text = document.createTextNode(object.name);
          tag.appendChild(text);
          tag.style.position = "fixed";
          tag.style.top = this.mouseEvent.clientY + "px";
          tag.style.left = this.mouseEvent.clientX + "px";
          tag.style.boxShadow = "0px 0px 5px 2px";
          if (element) element.appendChild(tag);
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  render() {
    return (
      <>
        <canvas id="viewer-3d" />
        <button
          className="float-button"
          style={{
            backgroundColor: this.state.allowRotation
              ? "rgb(227, 227, 227)"
              : "rgb(150, 150, 150)",
          }}
          onClick={() => {
            this.setState({ allowRotation: !this.state.allowRotation });
          }}
        >
          <FontAwesomeIcon icon={faRotate} />
        </button>
        <div id="new"></div>
      </>
    );
  }
}

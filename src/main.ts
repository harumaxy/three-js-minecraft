import * as Three from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { World } from "./world";
import Stats from "three/examples/jsm/libs/stats.module.js";

const stats = new Stats();
document.body.append(stats.dom);

const worldSize = 32;

const renderer = new Three.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
document.body.appendChild(renderer.domElement);

function getAspect() {
	return window.innerWidth / window.innerHeight;
}

// Camera setup
const camera = new Three.PerspectiveCamera(75, getAspect());
camera.position.set(-worldSize, worldSize / 2, -worldSize);
camera.lookAt(0, 0, 0);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(worldSize / 2, 0, worldSize / 2);

function setupLights() {
	const light1 = new Three.DirectionalLight();
	light1.position.set(1, 1, 1);
	scene.add(light1);

	const light2 = new Three.DirectionalLight();
	light2.position.set(-1, 1, -0.5);
	scene.add(light1);

	const ambient = new Three.AmbientLight();
	ambient.intensity = 0.1;
	scene.add(ambient);
}

// Scene setup

const scene = new Three.Scene();
const world = new World();
world.generate();
scene.add(world);

// Render loop

function animate() {
	// requestAnimationFrame(callback) = ブラウザにアニメーションを行うことを知らせる。アニメーション更新関数を渡して、次フレームに実行する。OneShot なので、毎フレーム呼び出す必要がある。ある意味再帰関数。
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	stats.update();
}

window.addEventListener("resize", () => {
	camera.aspect = getAspect();
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

setupLights();
animate();

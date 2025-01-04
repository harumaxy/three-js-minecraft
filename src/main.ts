import * as Three from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { World } from "./world";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { createUI } from "./ui";

const stats = new Stats();
document.body.append(stats.dom);

const worldSize = 32;

const renderer = new Three.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = Three.PCFSoftShadowMap; // 影の見た目を決める。高品質なほど負荷が高い。一番軽いのは BasicShadowMap だが見た目がひどい。
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
	const sun = new Three.DirectionalLight();
	sun.position.set(50, 50, 50);
	sun.castShadow = true;
	sun.shadow.camera.left = -50;
	sun.shadow.camera.right = 50;
	sun.shadow.camera.top = 50;
	sun.shadow.camera.bottom = -50;
	sun.shadow.camera.near = 0.1;
	sun.shadow.camera.far = 100;
	sun.shadow.bias = -0.0005; // ブロックの継ぎ目に影ができるのを防ぐ
	sun.shadow.mapSize = new Three.Vector2(512, 512); // 影のテクスチャサイズ。高いほどくっきり

	scene.add(sun);

	const shadowHelper = new Three.CameraHelper(sun.shadow.camera);
	scene.add(shadowHelper);

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

createUI(world);
setupLights();
animate();

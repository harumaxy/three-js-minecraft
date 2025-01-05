import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";

import { resources } from "./blocks";
import type { Player } from "./player";
import type { World } from "./world";

// lil gui = Three.js に同梱される GUI フレームワーク。おおよそすべてのUIが作れる

export function createUI(world: World, player: Player) {
	const gui = new GUI();
	gui.add(world.chunkSize, "width", 8, 128, 1).name("Width"); // 操作したいプロパティを持つオブジェクトを渡す。 obj, property_name, min, max [, step], Label
	gui.add(world.chunkSize, "height", 8, 64, 1).name("Height");

	const playerFolder = gui.addFolder("Player");
	playerFolder.add(player, "maxSpeed", 1, 20).name("Max Speed");
	playerFolder.add(player.cameraHelper, "visible").name("Show Camera Helper");

	const terrainFolder = gui.addFolder("Terrain");
	terrainFolder.add(world.params, "seed", 0, 100).name("Seed");
	terrainFolder.add(world.params.terrain, "scale", 10, 100).name("Scale");
	terrainFolder.add(world.params.terrain, "magnitude", 0, 1).name("Magnitude");
	terrainFolder.add(world.params.terrain, "offset", 0, 1).name("Offset");

	const resourcesFolder = gui.addFolder("Resources");
	for (const r of resources) {
		const folder = resourcesFolder.addFolder(r.name);
		folder.add(r, "scarcity", 0, 1).name("Scarcity");
		const scaleFolder = folder.addFolder("Scale");
		scaleFolder.add(r.scale, "x", 10, 100).name("X Scale");
		scaleFolder.add(r.scale, "y", 10, 100).name("Y Scale");
		scaleFolder.add(r.scale, "z", 10, 100).name("Z Scale");
	}

	// gui.add(world, "generate").name("Generate"); // メソッド名を指定した場合、それを実行するボタンを配置。 obj, method_name, Label
	gui.onChange(() => {
		// または、変更されるたびにコールバックを実行
		world.generate();
	});
}

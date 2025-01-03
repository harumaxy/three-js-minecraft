import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import type { World } from "./world";

// lil gui = Three.js に同梱される GUI フレームワーク。おおよそすべてのUIが作れる

export function createUI(world: World) {
	const gui = new GUI();
	gui.add(world.size, "width", 8, 128, 1).name("Width"); // 操作したいプロパティを持つオブジェクトを渡す。 obj, property_name, min, max [, step], Label
	gui.add(world.size, "height", 8, 64, 1).name("Height");

	const terrainFolder = gui.addFolder("Terrain");
	terrainFolder.add(world.params, "seed", 0, 100).name("Seed");
	terrainFolder.add(world.params.terrain, "scale", 10, 100).name("Scale");
	terrainFolder.add(world.params.terrain, "magnitude", 0, 1).name("Magnitude");
	terrainFolder.add(world.params.terrain, "offset", 0, 1).name("Offset");

	// gui.add(world, "generate").name("Generate"); // メソッド名を指定した場合、それを実行するボタンを配置。 obj, method_name, Label
	gui.onChange(() => {
		// または、変更されるたびにコールバックを実行
		world.generate();
	});
}

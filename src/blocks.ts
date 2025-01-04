import * as Three from "three";

const textureLoader = new Three.TextureLoader();

function loadTexture(path: string) {
	const texture = textureLoader.load(path);
	texture.colorSpace = Three.SRGBColorSpace;
	texture.minFilter = Three.NearestFilter; // Three.js がデフォルトで掛けてるフィルターを変える
	texture.magFilter = Three.NearestFilter;
	return texture;
}

const textures = {
	dirt: loadTexture("/textures/dirt.png"),
	grass: loadTexture("/textures/grass.png"),
	grassSide: loadTexture("/textures/grass_side.png"),
	stone: loadTexture("/textures/stone.png"),
	coalOre: loadTexture("/textures/coal_ore.png"),
	ironOre: loadTexture("/textures/iron_ore.png"),
};

export interface BlockType {
	id: number;
	name: string;
	color?: number;
	scale?: { x: number; y: number; z: number }; // リソースブロブの全体的なサイズ
	scarcity?: number; // 希少性
	material?: Three.Material | Three.Material[];
}

export const blocks = {
	empty: {
		id: 0,
		name: "empty",
	},
	grass: {
		id: 1,
		name: "grass",
		color: 0x559020,
		material: [
			// rl, tb, fb
			textures.grassSide,
			textures.grassSide,
			textures.grass,
			textures.dirt,
			textures.grassSide,
			textures.grassSide,
		].map((texture) => new Three.MeshLambertMaterial({ map: texture })),
	},
	dirt: {
		id: 2,
		name: "dirt",
		color: 0x807020,
		material: new Three.MeshLambertMaterial({ map: textures.dirt }),
	},
	stone: {
		id: 3,
		name: "stone",
		color: 0x808080,
		scale: { x: 30, y: 30, z: 30 },
		scarcity: 0.5,
		material: new Three.MeshLambertMaterial({ map: textures.stone }),
	},
	coalOre: {
		id: 4,
		name: "coalOre",
		color: 0x202020,
		scale: { x: 20, y: 20, z: 20 },
		scarcity: 0.8,
		material: new Three.MeshLambertMaterial({ map: textures.coalOre }),
	},
	ironOre: {
		id: 5,
		name: "ironOre",
		color: 0x806060,
		scale: { x: 60, y: 60, z: 60 },
		scarcity: 0.9,
		material: new Three.MeshLambertMaterial({ map: textures.ironOre }),
	},
} satisfies Record<string, BlockType>;

export const blockIdMap = new Map<number, BlockType>(
	Object.values(blocks).map((block) => [block.id, block]),
);

// ゲームの鉱物資源を追加で定義したい場合、blocks Map に追加した後 resources Array に追加する。 (拡張性の高い方法)
export const resources = [blocks.stone, blocks.coalOre, blocks.ironOre];

import * as Three from "three";
import { SimplexNoise } from "three/examples/jsm/Addons.js";
import { RNG } from "./rng";
import { blockIdMap, blocks, type BlockType } from "./blocks";

const geometry = new Three.BoxGeometry();
const material = new Three.MeshLambertMaterial(); // 鏡面反射ハイライトが無く、光沢の無いマテリアル。物理ベースでない Lambertian モデルを反射率計算に使うので、光沢のない Raw stone/wood などに効果的。若干パフォーマンスが高い

interface TerrainData {
	id: BlockType["id"]; // Block type = 0: empty, 1: glass, 2: dirt ...
	instanceId: number | null;
}

export class World extends Three.Group {
	// 後からブロックを掘る(削除する)ために、インスタンスid を保持する
	public data: TerrainData[][][] = [];

	params = {
		seed: 0,
		terrain: {
			scale: 30,
			magnitude: 0.5,
			offset: 0.2,
		},
	};

	constructor(public size = { width: 64, height: 32 }) {
		super();
	}

	generate() {
		this.initializeTerrain();
		this.generateTerrain();
		this.generateMeshes();
	}

	initializeTerrain() {
		this.data = Array.from({ length: this.size.width }, () =>
			Array.from({ length: this.size.height }, () =>
				Array.from({ length: this.size.width }, () => ({
					id: blocks.empty.id,
					instanceId: null,
				})),
			),
		);
	}

	generateTerrain() {
		const simplex = new SimplexNoise(new RNG(this.params.seed));
		const { magnitude, offset, scale } = this.params.terrain;
		for (let x = 0; x < this.size.width; x++) {
			for (let z = 0; z < this.size.width; z++) {
				const value = simplex.noise(x / scale, z / scale); // xz 座標でノイズ値を取得
				const scaledNoise = offset + magnitude * value; // magnitude/offset でノイズ値の振幅を調整
				let height = Math.floor(this.size.height * scaledNoise); // ノイズ値を高さとする
				height = Math.max(0, Math.min(height, this.size.height - 1));

				for (let y = 0; y <= height; y++) {
					if (y < height) {
						this.setBlockId(x, y, z, blocks.dirt.id);
					} else if (y === height) {
						this.setBlockId(x, y, z, blocks.grass.id);
					} else {
						this.setBlockId(x, y, z, blocks.empty.id);
					}
				}
			}
		}
	}

	getBlock(x: number, y: number, z: number): TerrainData | null {
		if (this.isBounds(x, y, z)) {
			return this.data[x][y][z];
		}
		return null;
	}
	isBounds(x: number, y: number, z: number): boolean {
		return (
			x >= 0 &&
			x < this.size.width &&
			y >= 0 &&
			y < this.size.height &&
			z >= 0 &&
			z < this.size.width
		);
	}

	setBlockId(x: number, y: number, z: number, id: number) {
		if (this.isBounds(x, y, z)) {
			this.data[x][y][z].id = id;
		}
	}

	setBlockInstanceId(x: number, y: number, z: number, instanceId: number) {
		if (this.isBounds(x, y, z)) {
			this.data[x][y][z].instanceId = instanceId;
		}
	}

	generateMeshes() {
		this.clear(); // UI から再生成するので、Three.Group.clear()。

		const maxCount = this.size.width ** 2 * this.size.height;
		// InstancedMesh = geometry, material が同じで Transform だけが違う複数のメッシュを効率的にレンダリングする。 draw call を大幅に抑える
		const mesh = new Three.InstancedMesh(geometry, material, maxCount);
		mesh.count = 0;

		const matrix = new Three.Matrix4();
		for (let x = 0; x < this.size.width; x++) {
			for (let y = 0; y < this.size.height; y++) {
				for (let z = 0; z < this.size.width; z++) {
					const blockId = this.getBlock(x, y, z)?.id;
					const blockType = blockIdMap.get(blockId ?? -1);
					const instanceId = mesh.count;

					if (blockId !== blocks.empty.id && !this.isBlockObscured(x, y, z)) {
						matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
						mesh.setMatrixAt(mesh.count++, matrix);
						mesh.setColorAt(instanceId, new Three.Color(blockType?.color));
						this.setBlockInstanceId(x, y, z, instanceId);
					}
				}
			}
		}

		this.add(mesh);
	}

	isBlockObscured(x: number, y: number, z: number): boolean {
		const updDownLeftRightForwardBack = [
			[x, y + 1, z],
			[x, y - 1, z],
			[x + 1, y, z],
			[x - 1, y, z],
			[x, y, z + 1],
			[x, y, z - 1],
		];
		const hasEmptyNeighbor = updDownLeftRightForwardBack
			.map(([x, y, z]) => {
				return this.getBlock(x, y, z)?.id ?? blocks.empty.id;
			})
			.some((id) => id === blocks.empty.id);

		return !hasEmptyNeighbor;
	}
}

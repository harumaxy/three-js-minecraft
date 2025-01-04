export interface BlockType {
	id: number;
	name: string;
	color?: number;
	scale?: { x: number; y: number; z: number }; // リソースブロブの全体的なサイズ
	scarcity?: number; // 希少性
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
	},
	dirt: {
		id: 2,
		name: "dirt",
		color: 0x807020,
	},
	stone: {
		id: 3,
		name: "stone",
		color: 0x808080,
		scale: { x: 30, y: 30, z: 30 },
		scarcity: 0.5,
	},
	coalOre: {
		id: 4,
		name: "coalOre",
		color: 0x202020,
		scale: { x: 20, y: 20, z: 20 },
		scarcity: 0.8,
	},
	ironOre: {
		id: 5,
		name: "ironOre",
		color: 0x806060,
		scale: { x: 60, y: 60, z: 60 },
		scarcity: 0.9,
	},
} satisfies Record<string, BlockType>;

export const blockIdMap = new Map<number, BlockType>(
	Object.values(blocks).map((block) => [block.id, block]),
);

// ゲームの鉱物資源を追加で定義したい場合、blocks Map に追加した後 resources Array に追加する。 (拡張性の高い方法)
export const resources = [blocks.stone, blocks.coalOre, blocks.ironOre];

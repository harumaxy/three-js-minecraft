export interface BlockType {
	id: number;
	name: string;
	color?: number;
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
} satisfies Record<string, BlockType>;

export const blockIdMap = new Map<number, BlockType>(
	Object.values(blocks).map((block) => [block.id, block]),
);

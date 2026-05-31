//	Mainly used to give moves flags
export const Scripts: ModdedBattleScriptsData = {
	inherit: 'gen9',
	init() {
		// Example: Give Judgment the 'divine' flag
		const divineMoves = ['lightofruin', 'judgment', 'sacredsword', 'sacredfire'];
		for (const moveid of divineMoves) {
			if (this.data.Moves[moveid]) {
				this.modData('Moves', moveid).flags.divine = 1;
			}
		}

		const kickMoves = ['tripleaxel', 'axekick', 'blazekick', 'doublekick',
			'highjumpkick', 'jumpkick', 'lowkick', 'lowsweep', 'megakick',
			'rollingkick', 'stomp', 'stompingtantrum', 'thunderouskick',
			'triplekick', 'tropkick', 'pyroball',
		];
		for (const moveid of kickMoves) {
			if (this.data.Moves[moveid]) {
				this.modData('Moves', moveid).flags.kick = 1;
			}
		}

		const hammerMoves = ['hammerarm', 'ivycudgel', 'crabhammer', 'gigatonhammer', 'woodhammer', 'shadowbone',
			'bonemerang', 'brutalswing',
		];
		for (const moveid of hammerMoves) {
			if (this.data.Moves[moveid]) {
				this.modData('Moves', moveid).flags.hammer = 1;
			}
		}

		const cannonMoves = ['hydrocannon', 'armorcannon', 'flashcannon', 'spikecannon',
			'zapcannon', 'octazooka', 'rockwrecker', 'fleurcannon',
		];
		for (const moveid of cannonMoves) {
			if (this.data.Moves[moveid]) {
				this.modData('Moves', moveid).flags.pulse = 1;
			}
		}
	},
};

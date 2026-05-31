export const Conditions: { [k: string]: any } = {
	psychicterrain: {
		inherit: true,
		onBasePower(basePower: number, attacker: Pokemon, defender: Pokemon, move: Move) {
			if (move.type === 'Psychic' && attacker.isGrounded()) {
				return this.chainModify([5325, 4096]);
			}
			if (move.type === 'Dark' && defender.isGrounded()) {
				this.debug('psychic terrain dark weaken');
				this.add('-activate', defender, 'move: Psychic Terrain', '[weaken]');
				return this.chainModify(0.5);
			}
		},
	},
	futuremove: {
		inherit: true,
		onResidualOrder: 3,
		onResidual(target: any) {
			const side = target;
			const conditionData = side.sideConditions['futuremove'];
			if (!conditionData) return;
			conditionData.duration--;
			if (conditionData.duration > 0) return;
			const source = conditionData.source;
			const move = this.dex.getActiveMove(conditionData.move);
			this.add('-message', `The meteor finally crashed down!`);
			const allTargets = this.getAllActive();
			for (const activeTarget of allTargets) {
				if (activeTarget === source) continue;
				this.actions.useMove(move, source, { target: activeTarget });
			}
			side.removeSideCondition('futuremove');
		},
	},
	vaporization: {
		name: 'Vaporization',
		onStart() {
			this.add('-fieldstart', 'move: Vaporization', '[of] ability: Vaporization Ability');
		},
		onResidual(pokemon: Pokemon) { // Explicitly set type to Pokemon
			if (pokemon.hasType('Water')) {
				this.damage(pokemon.baseMaxhp / 8, pokemon, pokemon);
			}
		},
		onTryHit(target: Pokemon, source: Pokemon, move: ActiveMove) {
			if (move.type === 'Water' && !this.field.isWeather('raindance') && move.category !== 'Status') {
				this.add('-fail', target, 'move: Vaporization', '[from] ability: Vaporization Ability');
				if (source.hasType('Water')) {
					this.damage(source.baseMaxhp / 8, source, source);
				}
				return null;
			}
		},
		onEnd() {
			this.add('-fieldend', 'move: Vaporization');
		},
	},
	unluckstack: {
		name: 'unluckstack',
		duration: 0,
		// 1. Added ': any' to explicitly type the parameters
		onStart(target: any, source: any, sourceEffect: any) {
			this.effectState.queue = [];
			this.effectState.queue.push({
				duration: 3,
				source, // 2. Changed 'source: source' to shorthand 'source'
			});
			this.add('-message', `An unluck strike is looming over ${target.name}!`);
		},
		// 1. Added ': any' to explicitly type the parameters
		onRestart(target: any, source: any, sourceEffect: any) {
			this.effectState.queue.push({
				duration: 3,
				source, // 2. Changed 'source: source' to shorthand 'source'
			});
			this.add('-message', `Another unluck strike is looming over ${target.name}!`);
		},
		onResidualOrder: 3,
		// 1. Added ': any' to explicitly type the parameter
		onResidual(target: any) {
			if (!this.effectState.queue) return;

			for (let i = this.effectState.queue.length - 1; i >= 0; i--) {
				// 3. Changed 'let strike' to 'const strike'
				const strike = this.effectState.queue[i];
				strike.duration--;

				if (strike.duration <= 0) {
					const move = this.dex.getActiveMove('unluckstrike');
					this.add('-message', `The delayed Unluck Strike hit ${target.name}!`);
					this.actions.useMove(move, strike.source, target);
					this.effectState.queue.splice(i, 1);
				}
			}

			if (this.effectState.queue.length === 0) {
				target.side.removeSlotCondition(target, 'unluckstack');
			}
		},
	},
	frenzycounter: {
		onStart(pokemon: Pokemon) {
			this.effectState.turns = 0;
		},
		onResidual(pokemon: Pokemon) {
			this.effectState.turns++;
			if (this.effectState.turns >= 3) {
				pokemon.faint();
			}
		},
	},
	catnappingtrap: {
		duration: 1,
		onSwitchIn(pokemon: Pokemon) {
			pokemon.addVolatile('trapped');
			this.add('-activate', pokemon, 'move: Catnapping');
		},
		onEnd(pokemon: Pokemon) {
			pokemon.removeVolatile('trapped');
		},
	},
	healblocktrap: {
		duration: 2,
		onTrapPokemon(pokemon: Pokemon) {
			pokemon.trapped = true;
		},
		onStart(pokemon: Pokemon) {
			this.add('-message', `${pokemon.name} was trapped by Heal Block!`);
		},
		onEnd(pokemon: Pokemon) {
			this.add('-message', `${pokemon.name} is no longer trapped.`);
		},
	},
};

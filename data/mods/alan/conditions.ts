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
	meteortimer: {
		duration: 3,
		// Fix: Explicitly define the type for 'side' to resolve TS7006
		onResidualOrder: 28,
		onResidual(side: Side) {
			const condition = side.getSideCondition('meteortimer');
			const remaining = condition?.duration;
			this.add('-message', `Meteor Impact will hit in ${remaining ?? 0} turns!`);
		},
		onEnd(side: Side) {
			// Use optional chaining for safer property access to resolve ESLint errors
			const source = this.effectData.source;
			this.add('-message', "The meteor impact landed!");
			const targets = side.active.concat(side.foe.active);
			for (const target of targets) {
				// Fix: Use optional chaining (target?.isActive)
				if (target?.isActive && target !== source) {
					this.add('-anim', target, 'Draco Meteor', target);
					this.moveHit(target, source, this.dex.getMove('meteorimpact'));
				}
			}
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
	bloodmoon: {
		name: 'BloodMoon',
		effectType: 'Weather',
		duration: 5,
		onFieldStart(field: Field, pokemon: Pokemon | null, effect: Effect | null) {
			this.add('-weather', 'BloodMoon');
		},
		onWeatherModifyDamage(damage: number, attacker: Pokemon, defender: Pokemon, move: ActiveMove) {
			if (defender.effectiveWeather() !== 'bloodmoon') return;
			if (move.type === 'Dark') {
				return this.chainModify([0x159A, 0x1000]); // 1.35x
			}
			if (move.type === 'Fairy') {
				return this.chainModify([0x0C00, 0x1000]); // 0.75x
			}
		},
		onFieldResidualOrder: 1,
		onFieldResidual() {
			this.add('-weather', 'BloodMoon', '[upkeep]');
			this.eachEvent('Weather');
		},
		onFieldEnd() {
			this.add('-weather', 'none');
		},

		onModifyPriority(priority: number, pokemon: Pokemon, target: Pokemon | null, move: ActiveMove) {
			if (!move) return priority;
			if (
				move.type === 'Dark' &&
				move.category === 'Status'
			) {
				return priority + 1;
			}
		},
	},
	hotcrossbunfire: {
		duration: 1,
		onStart(pokemon: Pokemon) {
			this.add('-start', pokemon, 'typechange', 'Fire');
		},
		onType(types: string[], pokemon: Pokemon) {
			return ['Fire'];
		},
		onEnd(pokemon: Pokemon) {
			this.add('-end', pokemon, 'typechange');
			this.add('-message', `${pokemon.name} cooled down!`);
		},
	},
};

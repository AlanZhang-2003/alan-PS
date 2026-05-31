export const Abilities: import('../../../sim/dex-abilities').ModdedAbilityDataTable = {
	divinepower: {
		name: "divinepower",
		shortDesc: "Boosts 'divine' moves by 1.5x.",
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if ((move.flags as any)['divine']) {
				this.debug('Divine Power boost');
				return this.chainModify(1.5);
			}
		},
	},
	divineprotection: {
		name: "divineprotection",
		shortDesc: "Immune to divine moves",
		onTryHit(target, source, move) {
			if ((move.flags as any)['divine']) {
				this.add('-immune', target, '[from] ability: Divine Protection');
				return null;
			}
		},
	},
	theeminenceintheshadow: {
		shortDesc: "Unaware + Supreme Overlord with half the boost.",
		name: "The Eminence in the Shadow",
		onAnyModifyBoost(boosts, pokemon) {
			const unawareUser = this.effectState.target;
			if (unawareUser === pokemon) return;
			if (unawareUser === this.activePokemon && pokemon === this.activeTarget) {
				boosts['def'] = 0;
				boosts['spd'] = 0;
				boosts['evasion'] = 0;
			}
			if (pokemon === this.activePokemon && unawareUser === this.activeTarget) {
				boosts['atk'] = 0;
				boosts['def'] = 0;
				boosts['spa'] = 0;
				boosts['accuracy'] = 0;
			}
		},
		onStart(pokemon) {
			if (pokemon.side.totalFainted) {
				this.add('-activate', pokemon, 'ability: The Eminence in the Shadow');
				const fallen = Math.min(pokemon.side.totalFainted, 5);
				this.add('-start', pokemon, `fallen${fallen}`, '[silent]');
				this.effectState.fallen = fallen;
			}
		},
		onEnd(pokemon) {
			this.add('-end', pokemon, `fallen${this.effectState.fallen}`, '[silent]');
		},
		onBasePowerPriority: 21,
		onBasePower(basePower, attacker, defender, move) {
			if (this.effectState.fallen) {
				const powMod = [20, 21, 22, 23, 24, 25];
				this.debug(`Supreme Overlord boost: ${powMod[this.effectState.fallen]}/25`);
				return this.chainModify([powMod[this.effectState.fallen], 20]);
			}
		},
		flags: { breakable: 1 },
	},
	twinfantasy: {
		shortDesc: "Slicing moves hit 2 times at 65% power.",
		name: "twinfantasy",
		onModifyMove(move, pokemon, target) {
			if (move.flags['slicing'] && !move.multihit) {
				move.multihit = 2;
			}
		},
		onBasePower(relayVar, source, target, move) {
			if (move.flags['slicing'] && move.multihit === 2) {
				return this.chainModify(0.65);
			}
		},
		flags: {},
	},
	illusion: {
		inherit: true,
		onModifyDamage(power, source) {
			if (source.illusion) {
				this.debug('Illusion - power boost');
				return this.chainModify([5325, 4096]);
			}
		},
	},
	megalaucher: {
		inherit: true,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['pulse'] || move.flags['bullet']) {
				return this.chainModify(1.3);
			}
		},
	},
	haki: {
		name: "haki",
		shortDesc: "Ignore type immunites and all attacks gain STAB",
		onModifyMovePriority: -5,
		onModifySTAB(stab, source, target, move) {
			if (stab === 2) return 2.25;
			return 1.5;
		},
		onEffectiveness(typeMod, target, type, move) {
			if (typeMod < 0 && !this.runEvent('Immunity', target, null, null, move.type)) {
				return 0; // Returns 0 to indicate neutral effectiveness (1x damage)
			}
		},
		onModifyMove(move) {
			move.ignoreImmunity = {};
		},
		flags: {},
	},
	striker: {
		name: "stiker",
		shortDesc: "Boost all kicking moves",
		onBasePower(basePower, attacker, defender, move) {
			if ((move.flags as any)['kick']) {
				return this.chainModify(1.2);
			}
		},
	},
	diablejambe: {
		name: "diablejambe",
		shortDesc: "All kick move becomes Fire Type and gains STAB",
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			if ((move as any).flags['kick'] && !pokemon.volatiles['dynamax']) { // hardcode
				move.type = 'Fire';
			}
		},
		flags: {},
	},
	heavymetal: {
		inherit: true,
		onModifyDefPriority: 6,
		onModifyDef(def) {
			return this.chainModify(5734 / 4096);
		},
		onModifySpe(spe) {
			// 0.9x Speed decrease
			return this.chainModify(0.9);
		},
		onDragOut(pokemon) {
			this.add('-ability', pokemon, 'Heavy Stance');
			this.add('-message', `${pokemon.name} is anchored by its heavy stance!`);
			return false;
		},
		onTryHit(target, source, move) {
			if (move.id === 'telekinesis') {
				this.add('-ability', target, 'Heavy Stance');
				return null;
			}
		},
		shortDesc: "This Pokemon's Defense and weight are doubled; it cannot be forced out.",
	},
	lightmetal: {
		inherit: true, // Inherit base game Light Metal logic if you want the weight reduction
		onModifyDefPriority: 6,
		onModifyDef(def) {
			// 0.7x Defense (a 30% reduction)
			return this.chainModify(0.7);
		},
		onModifySpe(spe) {
			// 1.3x Speed boost (5325 / 4096 is approx 1.3)
			return this.chainModify(5325 / 4096);
		},
		shortDesc: "This Pokemon's weight is halved; its Defense is lowered by 30%, and its Speed is increased by 30%.",
	},
	egoist: {
		name: "egoist",
		onAnyAfterBoost(boost, target, source, effect) {
			// 1. Identify the user of this ability correctly
			const pokemon = this.effectState.target;
			// 2. Only trigger if the boost happened to an opponent
			if (target.isAlly(pokemon) || target === pokemon) return;
			// 3. Filter for positive boosts only
			const positiveBoosts: Partial<BoostsTable> = {};
			let i: BoostID;
			for (i in boost) {
				const b = boost[i];
				if (b && b > 0) {
					positiveBoosts[i] = b;
				}
			}
			// 4. If there are positive boosts, copy them
			if (Object.keys(positiveBoosts).length > 0) {
				this.add('-ability', pokemon, 'Egoist');
				this.boost(positiveBoosts, pokemon);
			}
		},
		shortDesc: "When an opponent increases its stats, this Pokemon copies those boosts.",
	},
	petrify: {
		name: "petrify",
		onStart(pokemon) {
			let activated = false;
			for (const target of pokemon.adjacentFoes()) {
				if (!activated) {
					this.add('-ability', pokemon, 'Petrify');
					activated = true;
				}
				// 1. Clear all stat changes (Haze effect)
				target.clearBoosts();
				this.add('-clearboost', target, '[from] ability: Petrify', '[of] ' + pokemon.name);
				// 2. Lower Speed by 1 stage
				this.boost({ spe: -1 }, target, pokemon, null, true);
			}
		},
		shortDesc: "On switch-in, clears adjacent foes' stat boosts and lowers their Speed by 1.",
	},
	adrenalinerush: {
		name: "adrenalinerush",
		shortDesc: "This Pokemon's Speed is raised by 1 stage after it knocks out an opponent.",
		onSourceAfterFaint(length, target, source, effect) {
			// 1. Ensure the trigger was an actual move, not indirect damage like sandstorm
			if (effect && effect.effectType === 'Move') {
				this.add('-ability', source, 'Adrenaline Rush');
				// 2. Boost Speed by 1 stage
				this.boost({ spe: 1 }, source);
			}
		},
	},
	bonk: {
		name: "bonk",
		shortDesc: "Hammer moves have a 30% chance to confuse the target.",
		onModifyMove(move) {
			if ((move as any).flags['hammer']) {
				if (!move.secondaries) move.secondaries = [];
				// Check to prevent pushing the same effect multiple times in one turn
				if (move.secondaries.some(s => s.volatileStatus === 'confusion')) return;
				move.secondaries.push({
					chance: 30,
					volatileStatus: 'confusion',
				});
			}
		},
	},
	alluringdance: {
		name: "alluringdance",
		shortDesc: "30% chance to infatuate opposite-gender foes after using a dance move.",
		onAfterMove(pokemon, target, move) {
			// 1. Only trigger if the move has the 'dance' flag
			if (!move.flags['dance']) return;
			// 2. Loop through adjacent foes (to support Doubles)
			for (target of pokemon.adjacentFoes()) {
				// 3. Check for 30% chance and opposite gender
				// Gender check: target.gender must be opposite of pokemon.gender
				if (this.randomChance(3, 10)) {
					if (pokemon.gender && target.gender && pokemon.gender !== target.gender) {
						if (target.addVolatile('attract', pokemon)) {
							this.add('-ability', pokemon, 'Alluring Dance');
						}
					}
				}
			}
		},
	},
	bloodoath: {
		name: "bloodoath",
		shortDesc: "While active: Everyone deals 1.3x damage, cannot heal, and heals 30% from attacks.",
		// 1. Create the aura when switching in
		onStart(pokemon) {
			this.add('-ability', pokemon, 'Blood Oath');
			this.add('-message', "The Blood Oath forbids all mercy!");
		},
		// 2. Global 1.3x Attack Multiplier for everyone
		onAnyBasePowerPriority: 20,
		onAnyBasePower(basePower, attacker, defender, move) {
			return this.chainModify([5325, 4096]); // 1.3x boost
		},
		// 3. Global Healing Block (Heal Block logic)
		onAnyTryHeal(damage, target, source, effect) {
			// Allow healing ONLY if it comes from the draining effect (Blood Oath itself)
			if (effect && effect.id === 'bloodoath') return;
			// Blocks Recover, Roost, Leftovers, etc.
			this.debug('Blood Oath prevented healing');
			return false;
		},
		// 4. Global Life Steal (30% Drain on every attack)
		onAnyDamage(damage, target, source, effect) {
			if (effect && effect.effectType === 'Move' && damage > 0) {
				// Heal the attacker for 30% of damage dealt
				if (effect && effect.effectType === 'Move' && damage > 0) {
					// Heal the attacker for 30% of damage dealt
					// Use this.effect to represent Blood Oath as the source of healing
					this.heal(Math.floor(damage * 0.3), source, target, this.effect);
				}
			}
		},
	},
	blaze: {
		inherit: true,
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Fire') {
				// 1.5x if HP <= 33%, else 1.2x base
				const multiplier = (attacker.hp <= attacker.maxhp / 3) ? [6144, 4096] : [4915, 4096];
				return this.chainModify(multiplier);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(spa, attacker, defender, move) {
			if (move.type === 'Fire') {
				const multiplier = (attacker.hp <= attacker.maxhp / 3) ? [6144, 4096] : [4915, 4096];
				return this.chainModify(multiplier);
			}
		},
		shortDesc: "Fire moves deal 1.2x damage; 1.5x if user is at 1/3 HP or less.",
	},
	torrent: {
		inherit: true,
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Water') {
				const multiplier = (attacker.hp <= attacker.maxhp / 3) ? [6144, 4096] : [4915, 4096];
				return this.chainModify(multiplier);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(spa, attacker, defender, move) {
			if (move.type === 'Water') {
				const multiplier = (attacker.hp <= attacker.maxhp / 3) ? [6144, 4096] : [4915, 4096];
				return this.chainModify(multiplier);
			}
		},
		shortDesc: "Water moves deal 1.2x damage; 1.5x if user is at 1/3 HP or less.",
	},
	overgrow: {
		inherit: true,
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Grass') {
				const multiplier = (attacker.hp <= attacker.maxhp / 3) ? [6144, 4096] : [4915, 4096];
				return this.chainModify(multiplier);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(spa, attacker, defender, move) {
			if (move.type === 'Grass') {
				const multiplier = (attacker.hp <= attacker.maxhp / 3) ? [6144, 4096] : [4915, 4096];
				return this.chainModify(multiplier);
			}
		},
		shortDesc: "Grass moves deal 1.2x damage; 1.5x if user is at 1/3 HP or less.",
	},
	swarm: {
		inherit: true,
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Bug') {
				const multiplier = (attacker.hp <= attacker.maxhp / 3) ? [6144, 4096] : [4915, 4096];
				return this.chainModify(multiplier);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(spa, attacker, defender, move) {
			if (move.type === 'Bug') {
				const multiplier = (attacker.hp <= attacker.maxhp / 3) ? [6144, 4096] : [4915, 4096];
				return this.chainModify(multiplier);
			}
		},
		shortDesc: "Bug moves deal 1.2x damage; 1.5x if user is at 1/3 HP or less.",
	},
	sunshine: {
		name: "sunshine",
		shortDesc: "In Sun: boosts the user's highest attacking stat each turn. Resets all stats to 0 when Sun ends.",
		onResidualOrder: 28,
		onResidualSubOrder: 2,
		onResidual(pokemon) {
			if (['sunnyday', 'desolateland'].includes(this.field.effectiveWeather())) {
				// Determine the highest attacking stat between Attack and Special Attack
				let statName: 'atk' | 'spa' = 'atk';
				if (pokemon.getStat('spa', false, true) > pokemon.getStat('atk', false, true)) {
					statName = 'spa';
				}
				this.boost({ [statName]: 1 }, pokemon);
			}
		},
		onEnd(pokemon) {
			// This handles if the ability itself is lost/suppressed while in the sun,
			// but the weather check handles the true weather fade. See onUpdate below.
		},
		onUpdate(pokemon) {
			// Checks if the weather is NOT sunny, but the pokemon still has stat changes to clear
			if (!['sunnyday', 'desolateland'].includes(this.field.effectiveWeather())) {
				let hasBoosts = false;
				for (const stat in pokemon.boosts) {
					if (pokemon.boosts[stat as BoostID] !== 0) {
						hasBoosts = true;
						break;
					}
				}
				if (hasBoosts) {
					this.add('-ability', pokemon, 'Sunshine');
					this.add('-message', `${pokemon.name}'s stats returned to normal as the sunshine faded!`);
					pokemon.clearBoosts();
				}
			}
		},
	},
	supercharger: {
		name: "supercharger",
		shortDesc: "When hit by an Electric-type move, gains the Charge effect.",
		onDamagingHit(damage, target, source, move) {
			if (move.type === 'Electric') {
				// Checks if the Pokémon already has the Charge volatile status active
				if (!target.volatiles['charge']) {
					this.add('-ability', target, 'Super Charger');
					target.addVolatile('charge');
					this.add('-message', `${target.name} began charging power from the attack!`);
				}
			}
		},
	},
	weaknessexploit: {
		name: "weaknessexploit",
		shortDesc: "Attacks target the lower defensive stat of status-afflicted foes.",
		onModifyMove(move, pokemon, target) {
			if (!target) return;
			// Checks if the target has any active status ailment (Burn, Paralysis, Poison, Toxic, Sleep, Freeze)
			if (target.status) {
				const def = target.getStat('def', false, true);
				const spd = target.getStat('spd', false, true);
				// Forces the move to target whichever defensive stat is lower
				if (def < spd) {
					move.overrideDefensiveStat = 'def';
				} else if (spd < def) {
					move.overrideDefensiveStat = 'spd';
				}
				// If stats are perfectly equal, it naturally defaults to the move's original damage category
			}
		},
	},
	mineralize: {
		name: "mineralize",
		shortDesc: "This Pokémon's Normal-type moves become Rock-type and have 1.2x power.",
		onModifyType(move, pokemon) {
			// Checks if the move is Normal-type and isn't a special exception move (like Judgment or Multi-Attack)
			if (move.type === 'Normal' &&
				!['judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'weatherball'].includes(move.id)) {
				move.type = 'Rock';
				// This flag tells the engine that the move's type was altered by a "-ate" ability, triggering proper battle mechanics
				move.typeChangerBoosted = this.effect;
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			// Applies the 1.2x damage boost if the move was successfully transformed by Mineralize
			if (move.typeChangerBoosted === this.effect) {
				return this.chainModify([4915, 4096]); // Standard Showdown high-precision multiplier for 1.2x
			}
		},
	},
	moltencore: {
		name: "moltencore",
		shortDesc: "The user's Fire-type attacks are super effective against Rock and Ground types.",
		onEffectiveness(typeMod, target, type, move) {
			// Ensure the move being used is Fire-type
			if (move && move.type === 'Fire') {
				// Checks if the specific defensive type being evaluated is Rock or Ground
				if (type === 'Rock' || type === 'Ground') {
					return 1; // 1 represents a 2x super-effective multiplier in Showdown's type chart math
				}
			}
		},
	},
	alloutassault: {
		onBasePower(basePower, pokemon, target, move) {
			return this.chainModify(2);
		},
		onSourceAfterMove(target, source, move) {
			if (move.isZ || move.isMax) return;
			source.deductPP(move, 1); // Reduces PP by 1, making move effectively 3 total usage
		},
		name: "All-Out Assault",
		desc: "All moves deal 2x damage, but PP for all moves is reduced by 1 additional point per use (resulting in 3 total uses).",
		rating: 3,
	},
	pressure: {
		inherit: true,
		onStart(pokemon) {
			this.add('-ability', pokemon, 'Pressure');
			for (const target of this.getAllActive()) {
				target.clearBoosts();
				this.add('-clearallboost', target);
			}
		},
	},
	pointblank: {
		name: "pointblank",
		shortDesc: "Bullet moves have never accuracy and make contact. Always attack the target's weakest defensive stat",
		onModifyMove(move, attacker, defender) {
			// Check if the move is a bullet move
			if (move.flags['bullet']) {
				if (!defender) return;
				// Ensure the move never misses
				move.accuracy = true;
				// Convert the move to a contact move
				move.flags['contact'] = 1;
				move.overrideDefensiveStat = 'def';
				const def = defender.getStat('def', false, true);
				const spd = defender.getStat('spd', false, true);
				if (spd < def) {
					move.overrideDefensiveStat = 'spd';
				}
			}
		},
	},
	reverberate: {
		name: "reverberate",
		shortDesc: "This Pokémon repeats a sound-based move used by another Pokémon.",
		onAnyAfterMove(target, source, move) {
			if (move.flags['sound'] && source !== target) {
				// Corrected: Wrap the target Pokemon in an options object
				this.actions.useMove(move.id, source, { target });
			}
		},
	},
	vaporization: {
		name: "vaporization",
		shortDesc: "Water-type Pokémon take 1/8 damage each turn. Water-type moves used by Water-types fail.",
		onStart(source) {
			this.add('-message', "Vaporization has begun!");
			this.field.addPseudoWeather('vaporization');
		},
		onUpdate(pokemon) {
			if (!pokemon.isActive || pokemon.hasItem('utilityumbrella')) {
				this.field.removePseudoWeather('vaporization');
			}
		},
		onEnd(pokemon) {
			this.field.removePseudoWeather('vaporization');
		},
	},
	agitator: {
		name: "agitator",
		shortDesc: "All attacks have a 20% chance to taunt the target.",
		onModifyMove(move, pokemon, target) {
			// Guard Clauses:
			// 1. !move: Ensure move exists to prevent crashes.
			// 2. move.target === 'self': Prevent self-targeting moves (like healing/buffs) from taunting.
			// 3. !move.category: Ensure the move is an attack (Status moves have no category).
			if (!move || move.target === 'self' || move.category === 'Status') return;
			if (!move.secondaries) {
				move.secondaries = [];
			}
			move.secondaries.push({
				chance: 20, // 20% chance
				volatileStatus: 'taunt',
				ability: this.dex.abilities.get('agitator'),
			});
		},
	},
	fortification: {
		name: "fortification",
		shortDesc: "When hit by a critical hit, this Pokémon's Defense is raised to the maximum.",
		onHit(target, source, move) {
			if (!target.hp) return;
			if (move?.effectType === 'Move' && target.getMoveHitData(move).crit) {
				// 3. Apply maximum Defense boost
				this.boost({ def: 6 }, target, target);
			}
		},
	},
	sweetdreams: {
		name: "sweetdreams",
		shortDesc: "This Pokémon's Defense and Sp. Def are boosted by 50% while asleep.",
		onModifyDef(def, pokemon) {
			if (pokemon.status === 'slp') {
				return this.chainModify(1.5);
			}
		},
		onModifySpD(spd, pokemon) {
			if (pokemon.status === 'slp') {
				return this.chainModify(1.5);
			}
		},
	},
	sleepwalker: {
		name: "sleepwalker",
		shortDesc: "While asleep, this Pokémon would uses a random move instead.",
		onBeforeMove(pokemon, target, move) {
			if (pokemon.status !== 'slp') return;
			const possibleMoveIds = pokemon.moves.filter(m =>
				m !== move.id && !this.dex.moves.get(m).flags['charge']
			);

			if (possibleMoveIds.length > 0) {
				const randomMoveId = this.sample(possibleMoveIds);
				this.actions.runMove(randomMoveId, pokemon, pokemon.position);
				return false;
			}
		},
	},
	zenmode: {
		inherit: true,
		onModifyMove(move, attacker, defender) {
			if (attacker.species.id === 'darmanitanzen') {
				if (move.category === 'Physical') {
					move.category = 'Special';
				}
			}
		},
	},
	siren: {
		name: "siren",
		shortDesc: "Sound-based attacks have a 20% chance to trap the target.",
		onModifyMove(move, attacker, defender) {
			if (move.flags['sound']) {
				if (!move.secondaries) move.secondaries = [];
				move.secondaries.push({
					chance: 20,
					onHit(target, source) {
						target.addVolatile('trapped', source, move);
					},
					ability: this.dex.abilities.get('siren'),
				});
			}
		},
	},
	sandsprinkler: {
		name: "sandsprinkler",
		shortDesc: "Rock and Ground moves have a 20% chance to put the target to sleep.",
		onModifyMove(move) {
			if (!move.flags) return;
			if (move.type === 'Rock' || move.type === 'Ground') {
				// Ensure the move has a secondaries array, or create one
				if (!move.secondaries) move.secondaries = [];
				// Add the sleep secondary effect (20% chance)
				move.secondaries.push({
					chance: 10,
					status: 'slp',
					ability: this.dex.abilities.get('sandsprinkler'),
				});
			}
		},
	},
	shockingjaws: {
		name: "Shocking Jaws",
		shortDesc: "All biting moves have 50% chance of causing paralysis.",
		onModifyMove(move, attacker, defender) {
			if (move.flags['bite']) {
				if (!move.secondaries) {
					move.secondaries = [];
				}
				move.secondaries.push({
					chance: 50,
					status: 'par',
					ability: this.dex.abilities.get('shockingjaws'),
				});
			}
		},
	},
	resentment: {
		name: "Resentment",
		shortDesc: " Boost attack when the user's attack fails.",
		onAfterMove(target: any, source: any, move: any) {
			// Check if the move failed to hit the target
			if (!move.hit && source.isActive) {
				target.battle.add('-ability', target, 'Resentment');
				// Use source.battle to access the engine's boost method
				target.battle.boost({ atk: 1 }, target, target, this);
			}
		},
	},
	traumatizer: {
		name: "traumatizer",
		shortDesc: "When this Pokemon deals super effective damage, it lowers the target's Defense or Sp. Def by 1 stage based on the move's category.",
		onAfterMove(source, target, move) {
			// Check if the move is super effective
			if (move && move.effectType === 'Move' && target.getMoveHitData(move).typeMod > 0) {
				if (move.category === 'Physical') {
					this.boost({ def: -1 }, target, source, this.dex.abilities.get('traumatizer'));
				} else if (move.category === 'Special') {
					this.boost({ spd: -1 }, target, source, this.dex.abilities.get('traumatizer'));
				}
			}
		},
	},
	insectoid: {
		name: "insectoid",
		shortDesc: "Adds bug typing to this Pokemon on entry.",
		onStart(pokemon) {
			if (pokemon.hasType('Bug')) return;
			pokemon.addType('Bug');
			this.add('-start', pokemon, 'typeadd', 'Bug', '[from] ability: Insectoid');
		},
		onEnd(pokemon) {
			pokemon.setType(pokemon.getTypes(true));
		},
	},
	aquatic: {
		name: "aquatic",
		shortDesc: "Adds water typing to this Pokemon on entry.",
		onStart(pokemon) {
			if (pokemon.hasType('Water')) return;
			pokemon.addType('Water');
			this.add('-start', pokemon, 'typeadd', 'Water', '[from] ability: Aquatic');
		},
		onEnd(pokemon) {
			pokemon.setType(pokemon.getTypes(true));
		},
	},
	restfulslumber: {
		name: "restfulslumber",
		shortDesc: "This Pokémon heals 1/8 of its max HP each turn while asleep.",
		onResidual(pokemon) {
			if (pokemon.status === 'slp') {
				this.heal(pokemon.baseMaxhp / 8);
			}
		},
	},
	gravitationalpull: {
		name: "gravitationalpull",
		shortDesc: "Sets intense gravity upon entry.",
		onStart(source) {
			this.field.addPseudoWeather('gravity', source);
		},
	},
	hotfoot: {
		name: "hotfoot",
		shortDesc: "This Pokémon's Speed is 1.5x when burned.",
		onModifySpe(spe, pokemon) {
			if (pokemon.status === 'brn') {
				return this.chainModify(1.5);
			}
		},
	},
	martialartist: {
		name: "martialartist",
		shortDesc: "Adds fighting typing to this Pokemon on entry.",
		onStart(pokemon) {
			if (pokemon.hasType('Fighting')) return;
			pokemon.addType('Fighting');
			this.add('-start', pokemon, 'typeadd', 'Fighting', '[from] ability: Martial Artist');
		},
		onEnd(pokemon) {
			pokemon.setType(pokemon.getTypes(true));
		},
	},
	tanglinghair: {
		inherit: true,
		onTryHit(target, source, move) {
			if (move.type === 'Water') {
				this.add('-immune', target, '[from] ability: My Custom Ability');
				return null;
			}
		},
		onSourceModifyAtkPriority: 5,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Fire') {
				return this.chainModify(2); // Multiplies damage by 2
			}
		},
	},
	gooey: {
		inherit: true,
		onModifyMove(move, attacker, defender) {
			// New: Lower target's speed when user uses a contact move
			if (move.flags['contact']) {
				move.onAfterHit = function (target, source) {
					if (target.isActive && target.hasAbility('gooey')) {
						this.add('-ability', source, 'Gooey');
						this.boost({ spe: -1 }, target, source, null, true);
					}
				};
			}
		},
	},
	unluck: {
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			// 1. Check if the move makes contact
			if (!move.flags['contact']) return;

			// 2. Check if Unluck has already activated for this Pokémon this turn
			if (target.m.lastUnluckTurn === this.turn) return;
			// 3. Mark that it has activated this turn
			target.m.lastUnluckTurn = this.turn;

			// 4. Display the ability activation text and apply the timer to the attacker's slot
			this.add('-ability', target, 'Unluck');
			source.side.addSlotCondition(source, 'unluckstack');
		},
		name: "Unluck",
	},
	frenzy: {
		name: "Frenzy",
		shortDesc: "Raises highest attacking stat on entry/KO. Contact spreads this Ability. Faints if no attacking move is used for 3 turns.",

		// Track turns without attacking
		onStart(pokemon) {
			pokemon.addVolatile('frenzycounter');
		},

		// 1) Raise highest attacking stat on switch-in
		onSwitchIn(pokemon) {
			const stat = pokemon.getStat('atk', false, true) >= pokemon.getStat('spa', false, true) ? 'atk' : 'spa';
			this.boost({ [stat]: 1 }, pokemon);
		},

		// 1) Raise highest attacking stat after KOing a Pokémon
		onSourceFaint(target, source, effect) {
			if (!source || source.fainted) return;

			const stat = source.getStat('atk', false, true) >= source.getStat('spa', false, true) ? 'atk' : 'spa';
			this.boost({ [stat]: 1 }, source);
		},

		// 2) Contact spreads the ability
		onDamagingHit(damage, target, source, move) {
			if (!move.flags['contact']) return;
			if (!source || source.fainted) return;
			if (source.hasAbility('frenzy')) return;

			source.setAbility('frenzy', target);
			this.add('-ability', source, 'Frenzy', '[from] ability: Frenzy');
		},

		// Reset counter when using an attacking move
		onAfterMove(pokemon, target, move) {
			if (move.category !== 'Status') {
				pokemon.volatiles['frenzycounter'].turns = 0;
			}
		},

		condition: {},
	},
	hypercutter: {
		inherit: true,
		onModifyMove(move) {
			if (move.flags['contact']) {
				move.critRatio = (move.critRatio || 0) + 1;
			}
		},
	},
	surefire: {
		name: "Sure Fire",
		shortDesc: "This Pokemon's move secondary effects always occur.",
		onModifyMove(move, pokemon) {
			if (!move.secondaries) return;
			for (const secondary of move.secondaries) {
				secondary.chance = 100;
			}
		},
	},
};

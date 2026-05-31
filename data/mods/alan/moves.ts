export const Moves: import('../../../sim/dex-moves').ModdedMoveDataTable = {
	razorwind: {
		inherit: true,
		isNonstandard: null,
		accuracy: 100,
		basePower: 80,
		category: "Special",
		desc: "The user gathers wind on the first turn and raises its Special Attack; on the second turn, Razor Wind deals damage with high Crit ratio. If tailwind is up, attack immedeatly.",
		pp: 10,
		priority: 0,
		flags: { charge: 1, protect: 1, mirror: 1 },
		onTryMove(attacker, defender, move) {
			// Second turn: actually attack
			if (attacker.removeVolatile(move.id)) {
				return;
			}
			this.boost({ spa: 1 }, attacker);
			if (attacker.side.sideConditions['tailwind']) {
				this.add('-activate', attacker, 'move: Tailwind');
				return;
			}
			this.add('-prepare', attacker, move.name);
			if (!this.runEvent('ChargeMove', attacker, defender, move)) {
				return;
			}
			attacker.addVolatile(move.id);
			return null;
		},
		condition: {
			duration: 2,
		},
		target: "normal",
		type: "Flying",
	},
	present: {
		inherit: true,
		accuracy: 100,
		basePower: 0,
		category: "Status",
		shortDesc: "Gives the target a random item.",
		desc: "The target receives a random item. Choice items depend on the target's lowest stat.",
		isNonstandard: null,
		onModifyMove(move) {
			// Kill original Present logic
			move.basePower = 0;
			move.category = "Status";
			move.shortDesc = "Gives the target a random item.";
			move.desc = "The target receives a random item. Choice items depend on the target's lowest stat.";
			move.heal = undefined;
			move.infiltrates = undefined;
		},
		onTryHit(target, source, move) {
			// allow move to always execute
			return true;
		},
		onHit(target, source, move) {
			// ❌ Fail on items that cannot be removed
			const item = target.getItem();

			if (item.id) {
				if (!this.singleEvent('TakeItem', item, target.itemState, target, target, move, item)) {
					this.add('-fail', target, 'move: Present');
					return false;
				}
				const oldItem = target.takeItem(source);
				if (oldItem) {
					this.add(
						'-enditem',
						target,
						oldItem.name,
						'[from] move: Present'
					);
				}
			}
			// Determine stats
			const stats: Record<'atk' | 'def' | 'spa' | 'spd' | 'spe', number> = {
				atk: target.getStat('atk', false, true),
				def: target.getStat('def', false, true),
				spa: target.getStat('spa', false, true),
				spd: target.getStat('spd', false, true),
				spe: target.getStat('spe', false, true),
			};
			let lowest: keyof typeof stats = 'spe';
			for (const s in stats) {
				if (stats[s as keyof typeof stats] < stats[lowest]) {
					lowest = s as keyof typeof stats;
				}
			}
			const choiceMap: Record<string, string> = {
				atk: 'choiceband',
				spa: 'choicespecs',
				spe: 'choicescarf',
			};
			const pool = [
				'lifeorb',
				'sitrusberry',
				'lumberry',
				'ejectbutton',
				'ironball',
				'redcard',
				'assaultvest',
				'covertcloak',
				'ringtarget',
				'floatstone',
			];
			// Bias toward choice item based on lowest stat
			pool.push(choiceMap[lowest]);
			const newItem = this.sample(pool);
			if (target.setItem(newItem)) {
				this.add('-item', target, newItem, '[from] move: Present');
			}
		},
	},
	megidolaon: {
		accuracy: 100,
		basePower: 200,
		category: "Special",
		shortDesc: "No additional effect.",
		name: "Megidolaon",
		gen: 9,
		pp: 10,
		priority: 0,
		flags: { protect: 1, mirror: 1, divine: 1 } as any,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Hyper Beam', target);
			this.add('-anim', source, 'Earthquake', target);
		},
		target: "normal",
		type: "???",
	},
	forestscurse: {
		inherit: true,
		isNonstandard: null,
		shortDesc: "The target gets lost within the user's forest, and becomes a part of it",
		onHit(target, source, move) {
			if (target.hasType('Grass')) return false;
			if (!target.addType('Grass')) return false;
			this.add('-start', target, 'typeadd', 'Grass', '[from] move: Forest\'s Curse');
			if (target.tryTrap()) {
				target.addVolatile('trapped', source, move);
				this.add('-activate', target, 'move: Forest\'s Curse');
			}
		},
	},
	flamewheel: {
		inherit: true,
		isNonstandard: null,
		selfSwitch: true,
	},
	inferno: {
		inherit: true,
		isNonstandard: null,
		basePower: 150,
	},
	cut: {
		inherit: true,
		isNonstandard: null,
		accuracy: 100,
		pp: 20,
		priority: 0,
		willCrit: true,
		type: "steel",
	},
	powdersnow: {
		inherit: true,
		isNonstandard: null,
		accuracy: 100,
		basePower: 70,
		basePowerCallback(pokemon, target, move) {
			if (target.status === 'brn') {
				this.debug('BP doubled on burned target');
				return move.basePower * 2;
			}
			return move.basePower;
		},
		pp: 20,
		priority: 0,
		flags: { contact: 1, protect: 1, mirror: 1, metronome: 1 },
		onHit(target) {
			if (target.status === 'brn') target.cureStatus();
		},
		target: "normal",
		type: "Ice",
	},
	ember: {
		inherit: true,
		isNonstandard: null,
		accuracy: 100,
		basePower: 20,
		flags: { contact: 1, protect: 1, mirror: 1, metronome: 1 },
		secondary: {
			chance: 100,
			status: 'brn',
		},
		type: "Fire",
	},
	soak: {
		num: 487,
		accuracy: 100,
		basePower: 0,
		category: "Status",
		name: "Soak",
		isNonstandard: null,
		volatileStatus: 'Soak',
		pp: 20,
		priority: 0,
		flags: { protect: 1, reflectable: 1, mirror: 1, allyanim: 1, metronome: 1 },
		condition: {
			onStart(pokemon) {
				if (pokemon.terastallized) return false;
				this.add('-start', pokemon, 'Soak');
			},
			onEffectivenessPriority: -2,
			onEffectiveness(typeMod, target, type, move) {
				if (move.type !== 'Electric') return;
				if (!target) return;
				if (type !== target.getTypes()[0]) return;
				return typeMod + 1;
			},
		},
		target: "normal",
		type: "Water",
	},
	judgement: {
		inherit: true,
		isNonstandard: null,
		flags: { divine: 1 } as any,
	},
	milkdrink: {
		inherit: true,
		isNonstandard: null,
		secondary: {
			chance: 30,
			self: {
				boosts: { def: 1 },
			},
		},
	},
	shelter: {
		num: 842,
		accuracy: true,
		basePower: 0,
		category: "Status",
		name: "Shelter",
		pp: 10,
		priority: 4,
		flags: { metronome: 1, noassist: 1, failcopycat: 1 },
		stallingMove: true,
		volatileStatus: 'protect',
		onPrepareHit(pokemon) {
			return !!this.queue.willMove(pokemon) || this.runEvent('PrepareHit', pokemon);
		},
		onHit(pokemon) {
			// This triggers the Defense boost when the move is clicked successfully,
			// even if the 'protect' effect fails because of consecutive use.
			this.boost({ def: 1 }, pokemon);
		},
		// Standard logic to ensure the move can fail if used repeatedly
		onTryHit(target, source, move) {
			return !!this.queue.willMove(source) && !!this.runEvent('TryHit', target, source, move);
		},
		secondary: {},
		target: "self",
		type: "Steel",
		zMove: { boost: { def: 1 } },
	},
	uniformroom: {
		name: "Uniform Room",
		accuracy: true,
		basePower: 0,
		category: "Status",
		shortDesc: "Priority moves fails",
		gen: 9,
		pp: 5,
		priority: -7,
		flags: { mirror: 1, bypasssub: 1 },
		pseudoWeather: 'uniformroom',
		condition: {
			duration: 5,
			durationCallback(target, source, effect) {
				if (source?.hasItem('roomextender')) return 8; // Custom item support if desired
				return 5;
			},
			onStart(target, source) {
				this.add('-fieldstart', 'move: Uniform Room', '[of] ' + source.name);
			},
			// This logic blocks priority moves while the room is active
			onTryHit(target, source, move) {
				if (source.isAlly(target)) return; // Don't block ally status moves
				if (move.priority > 0.1) {
					this.add('-activate', target, 'move: Uniform Room');
					return null;
				}
			},
			onFieldRestart(target, source) {
				this.field.removePseudoWeather('uniformroom');
			},
			onFieldEnd() {
				this.add('-fieldend', 'move: Uniform Room');
			},
		},
		target: "all",
		type: "Psychic",
	},
	sereneroom: {
		name: "Serene Room",
		accuracy: true,
		basePower: 0,
		category: "Status",
		shortDesc: "Secondary effect chances are doubled.",
		gen: 9,
		pp: 5,
		priority: -7,
		flags: { mirror: 1, bypasssub: 1 },
		pseudoWeather: 'sereneroom',
		condition: {
			duration: 5,
			durationCallback(target, source, effect) {
				if (source?.hasItem('roomextender')) return 8;
				return 5;
			},
			onStart(target, source) {
				this.add('-fieldstart', 'move: Serene Room', '[of] ' + source.name);
			},
			// Logic to double secondary effect chances
			onModifyMove(move) {
				if (move.secondaries) {
					for (const secondary of move.secondaries) {
						if (secondary.chance) {
							secondary.chance = Math.min(secondary.chance * 2, 100);
						}
					}
				}
				if (move.self?.chance) {
					move.self.chance = Math.min(move.self.chance * 2, 100);
				}
			},
			onFieldRestart(target, source) {
				this.field.removePseudoWeather('sereneroom');
			},
			onFieldEnd() {
				this.add('-fieldend', 'move: Serene Room');
			},
		},
		target: "all",
		type: "Psychic",
	},
	inverseroom: {
		name: "Inverse Room",
		accuracy: true,
		basePower: 0,
		category: "Status",
		shortDesc: "Type effectiveness is inverted.",
		gen: 9,
		pp: 5,
		priority: -7,
		flags: { mirror: 1, bypasssub: 1 },
		pseudoWeather: 'inverseroom',
		condition: {
			duration: 5,
			durationCallback(target, source, effect) {
				if (source?.hasItem('roomextender')) return 8; // Custom item support [cite: 3]
				return 5;
			},
			onStart(target, source) {
				this.add('-fieldstart', 'move: Inverse Room', '[of] ' + source.name); // [cite: 4]
			},
			// Logic to invert type effectiveness
			onEffectiveness(typeMod, target, type, move) {
				// Inverts the type effectiveness value
				return -typeMod;
			},
			onFieldRestart(target, source) {
				this.field.removePseudoWeather('inverseroom'); // [cite: 7]
			},
			onFieldEnd() {
				this.add('-fieldend', 'move: Inverse Room'); // [cite: 8]
			},
		},
		target: "all",
		type: "Psychic", // [cite: 9]
	},
	suppressionroom: {
		name: "Suppression Room",
		accuracy: true,
		basePower: 0,
		category: "Status",
		shortDesc: "Negates the abilities of all Pokémon on the field.",
		gen: 9,
		pp: 5,
		priority: -7,
		flags: { mirror: 1, bypasssub: 1 },
		pseudoWeather: 'suppressionroom',
		condition: {
			duration: 5,
			durationCallback(target, source, effect) {
				if (source?.hasItem('roomextender')) return 8;
				return 5;
			},
			onStart(target, source) {
				this.add('-fieldstart', 'move: Suppression Room', '[of] ' + source.name);
				for (const pokemon of this.getAllActive()) {
					if (!pokemon.hasAbility(['neutralizinggas', 'multitype', 'zenmode', 'stancechange',
						'powerconstruct', 'schooling', 'rkssystem', 'shieldsdown', 'battlebond', 'comatose',
						'disguise', 'gulpmissile', 'iceface', 'asone', 'terashift'])) {
						pokemon.addVolatile('gastroacid');
					}
				}
			},
			onAnySwitchIn(pokemon) {
				if (!pokemon.hasAbility(['neutralizinggas', 'multitype', 'zenmode', 'stancechange',
					'powerconstruct', 'schooling', 'rkssystem', 'shieldsdown', 'battlebond', 'comatose',
					'disguise', 'gulpmissile', 'iceface', 'asone', 'terashift'])) {
					pokemon.addVolatile('gastroacid');
				}
			},
			onFieldEnd() {
				this.add('-fieldend', 'move: Suppression Room');
				for (const pokemon of this.getAllActive()) {
					pokemon.removeVolatile('gastroacid');
				}
			},
		},
		target: "all",
		type: "Dark",
	},
	sunsteelstrike: {
		inherit: true,
		isNonstandard: null,
		shortDesc: "Ignores target's ability. Combined Steel/Fire type.",
		onEffectiveness(typeMod, target, type, move) {
			// This runs the effectiveness calculation a second time against the target,
			// but evaluates it as a Fire-type move instead.
			return typeMod + this.dex.getEffectiveness('Fire', type);
		},
	},
	moongeistbeam: {
		inherit: true,
		isNonstandard: null,
		shortDesc: "Ignores target's ability. Combined Steel/Fire type.",
		onEffectiveness(typeMod, target, type, move) {
			// This runs the effectiveness calculation a second time against the target,
			// but evaluates it as a Fire-type move instead.
			return typeMod + this.dex.getEffectiveness('Dark', type);
		},
	},
	torturedance: {
		accuracy: 100,
		basePower: 0,
		category: 'Status',
		name: "Torture Dance",
		shortDesc: "Lowers target's Def/SpD by 1. User boosts highest Atk stat if target has a status.",
		pp: 15,
		gen: 9,
		priority: 0,
		flags: { protect: 1, reflectable: 1, mirror: 1, dance: 1, metronome: 1 }, // Added dance flag for flavor/Oricorio
		// Decreases the target's Defense and Special Defense by 1 stage
		boosts: {
			def: -1,
			spd: -1,
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Dragon Dance', target);
		},
		// Checks the target for status ailments and boosts the user's highest attacking stat
		onHit(target, source) {
			if (target.status && ['brn', 'frz', 'par', 'slp', 'psn', 'tox'].includes(target.status)) {
				// Determine whether Attack or Special Attack is higher
				const bestStat = source.getStat('atk') >= source.getStat('spa') ? 'atk' : 'spa';
				this.boost({ [bestStat]: 1 }, source);
			}
		},
		target: 'normal',
		type: 'Dark',
	},
	blackout: {
		accuracy: 100,
		basePower: 130,
		category: 'Special',
		name: "Blackout",
		shortDesc: "Fails if the user isn't Electric. Removes the user's Electric type.",
		pp: 5,
		priority: 0,
		gen: 9,
		flags: { protect: 1, mirror: 1 },
		type: "Electric",
		// --- BURN UP MECHANIC (ELECTRIC VERSION) ---
		onTryMove(pokemon) {
			this.attrLastMove('[still]');
			if (!pokemon.hasType('Electric')) {
				this.add('-fail', pokemon, 'move: Black Out');
				this.hint("A Pokémon must be Electric-type to use this move.");
				return null;
			}
		},
		onPrepareHit(target, source, move) {
			this.add('-anim', source, 'Discharge', target);
		},
		onHit(target, source) {
			source.getTypes().forEach(type => {
				if (type === 'Electric') {
					source.setType(source.getTypes().filter(t => t !== 'Electric'));
					this.add('-start', source, 'typechange', source.getTypes().join('/'), '[from] move: Black Out');
				}
			});
		},
		target: 'normal',
	},
	meteorimpact: {
		accuracy: 100,
		basePower: 130,
		category: 'Special',
		name: "Meteor Impact",
		type: 'Fire',
		shortDesc: "Hits everyone on the field except the user 2 turns after use.",
		pp: 10,
		priority: 0,
		gen: 9,
		flags: { futuremove: 1 },
		ignoreImmunity: true,
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Draco Meteor', target);
		},
		onTryMove(pokemon) {
			this.attrLastMove('[still]');
			if (!pokemon.side.addSideCondition('futuremove')) return false;
			Object.assign(pokemon.side.sideConditions['futuremove'], {
				duration: 3, // This sets the 2-turn delay!
				move: 'meteorimpact',
				source: pokemon,
				moveData: {
					id: 'meteorimpact',
					name: "Meteor Impact",
					accuracy: 100,
					basePower: 130,
					category: 'Special',
					type: 'Fire',
					flags: { futuremove: 1 },
					ignoreImmunity: true,
				},
			});
			this.add('-start', pokemon, 'move: Meteor Impact');
			return null; // Prevents the move from executing immediately
		},
		target: 'allAdjacent',
	},
	pumpkinsmash: {
		accuracy: 80,
		basePower: 60,
		category: 'Physical',
		name: "Pumpkin Smash",
		shortDesc: "100% chance to set Grassy Terrain after dealing damage.",
		pp: 10,
		priority: 0,
		gen: 9,
		flags: { protect: 1, mirror: 1, metronome: 1, hammer: 1 } as any,
		type: "Grass", // Matches the pumpkin/grassy terrain theme
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Wood Hammer', target);
		},
		// --- SETS GRASSY TERRAIN IF IT DEALS DAMAGE ---
		secondary: {
			chance: 100,
			self: {
				onHit(target, source, move) {
					this.field.setTerrain('grassyterrain');
				},
			},
		},
		target: 'normal',
	},
	melonmasher: {
		accuracy: 50,
		basePower: 140,
		category: 'Physical',
		name: "Melon Masher",
		pp: 5,
		priority: 0,
		gen: 9,
		flags: { protect: 1, mirror: 1, metronome: 1, hammer: 1 } as any,
		type: "Water",
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Crabhammer', target);
		},
		secondary: {
			chance: 100,
			boosts: { def: -2 },
		},
		target: 'normal',
		shortDesc: "100% chance to lower the target's Defense by 2. Fails often.",
	},
	whacaton: {
		accuracy: 100,
		basePower: 70,
		category: 'Physical',
		name: "Whac-A-Ton",
		shortDesc: "Super effective against Ground. Deals double damage to targets using Dig.",
		pp: 20,
		priority: 0,
		gen: 9,
		flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, hammer: 1 } as any,
		type: "Steel",
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onTryHit(target, source, move) {
			if (target.volatiles['twoturnmove'] && target.volatiles['twoturnmove'].move === 'dig') {
				return;
			}
		},
		onPrepareHit(target, source, move) {
			this.add('-anim', source, 'Gigaton Hammer', target);
		},
		onEffectiveness(typeMod, target, type) {
			if (type === 'Ground') return 1; // Forces Ground to be treated as weak to Steel (+1)
		},
		onModifyMove(move, pokemon, target) {
			if (target?.volatiles['twoturnmove'] && target.volatiles['twoturnmove'].move === 'dig') {
				move.basePower *= 2; // Doubles the Base Power if they are underground
			}
		},
		target: 'normal',
	},
	icebreaker: {
		accuracy: 100,
		basePower: 90,
		category: "Physical",
		name: "Ice Breaker",
		desc: "The user break the ice by taking the first action; hits on the first turn only. ",
		pp: 10,
		priority: 2,
		flags: { protect: 1, mirror: 1 },
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onTry(source, target) {
			if (source.activeMoveActions > 1) {
				this.hint("Ice Breaker only works on the first turn the user is on the field.");
				return false;
			}
		},
		onPrepareHit(target, source, move) {
			this.add('-anim', source, 'Ice Punch', target);
		},
		target: "normal",
		type: "Ice",
		contestType: "Cool",
	},
	deathroll: {
		name: "Death Roll",
		shortDesc: "20% chance of causing confusion. Ignore target's stat changes.",
		accuracy: 100,
		basePower: 100,
		category: 'Physical',
		pp: 5,
		priority: 0,
		gen: 9,
		flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, bite: 1 },
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source, move) {
			this.add('-anim', source, 'Fishious Rend', target);
		},
		ignoreDefensive: true,
		ignoreEvasion: true,
		secondary: {
			chance: 20,
			volatileStatus: 'confusion',
		},
		target: "normal",
		type: "Water",
		contestType: "Tough",
	},
	lovelybite: {
		name: "Lovely Bite",
		shortDesc: "10% chance to infatuate the foe. Boosted by Strong Jaw.",
		accuracy: 100,
		basePower: 85,
		category: 'Physical',
		pp: 15,
		priority: 0,
		gen: 9,
		flags: { contact: 1, protect: 1, mirror: 1, bite: 1 },
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source, move) {
			this.add('-anim', source, 'Bite', target);
			this.add('-anim', source, 'Sweet Kiss', target);
		},
		secondary: {
            chance: 10,
            volatileStatus: 'attract',

        },
		target: "normal",
		type: "Fairy",
		contestType: "Cute",
	},
	jaggedfang: {
		name: "Jagged Fang",
		shortDesc: "10% ferocious bite. 10% chance to raise user's Attack.",
		accuracy: 100,
		basePower: 80,
		category: 'Physical',
		pp: 15,
		priority: 0,
		gen: 9,
		flags: { contact: 1, protect: 1, mirror: 1, bite: 1 },
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source, move) {
			this.add('-anim', source, 'Crunch', target);
			this.add('-anim', source, 'Rockslide', target);
		},
		secondary: {
			chance: 10,
			boosts: { atk: 1 },
		},
		target: "normal",
		type: "Rock",
		contestType: "Cool",
	},
	ruthlessmaw: {
		accuracy: 90,
		basePower: 20,
		category: "Physical",
		name: "Ruthless Maw",
		pp: 10,
		priority: 0,
		flags: { contact: 1, protect: 1, mirror: 1, bite: 1 },
		multihit: [2, 3],
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source, move) {
			this.add('-anim', source, 'Outrage', target);
		},
		onBasePower(basePower, source, target, move) {
			if (move.hit > 1) {
				const hitPowers = [0, 20, 40, 60]; // Index 1=40, 2=60, 3=80
				return hitPowers[move.hit];
			}
			return basePower;
		},
		target: "normal",
		type: "Dragon",
	},
	fertilefang: {
		accuracy: 100,
		basePower: 80,
		category: "Physical",
		name: "Fertile Fang",
		shortDesc: "Has a 10% chance to apply leech seed",
		pp: 20,
		priority: 0,
		flags: { contact: 1, protect: 1, mirror: 1, bite: 1 },
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Power Whip', target);
		},
		secondary: {
			chance: 10,
			volatileStatus: 'leechseed',
		},
		target: "normal",
		type: "Grass",
		contestType: "Clever",
	},
	thinningchomp: {
		accuracy: 100,
		basePower: 55,
		category: "Physical",
		name: "Thinning Chomp",
		shortDesc: "Blocks the target from healing",
		pp: 15,
		priority: 0,
		flags: { contact: 1, protect: 1, mirror: 1, bite: 1 },
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Crunch', target);
			this.add('-anim', source, 'Nightshade', target);
		},
		onHit(target, source) {
			target.addVolatile('healblock');
		},
		target: "normal",
		type: "Dark",
		contestType: "Tough",
	},
	dualjaws: {
		accuracy: 100,
		basePower: 35,
		category: "Physical",
		name: "Dual Jaws",
		shortDesc: "The user bites with it's two jaws, trapping the target until the user switches out",
		pp: 10,
		priority: 0,
		flags: { contact: 1, protect: 1, mirror: 1, bite: 1 },
		multihit: 2,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Crunch', target);
		},
		onHit(target, source, move) {
			target.addVolatile('trapped', source, move, "trapper");
		},
		target: "normal",
		type: "Water",
		contestType: "Tough",
	},
	ironfang: {
		accuracy: 100,
		basePower: 85,
		category: "Physical",
		name: "Iron Fang",
		shortDesc: "Breaks screens",
		pp: 15,
		priority: 0,
		flags: { contact: 1, protect: 1, mirror: 1, bite: 1 },
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Metal Claw', target);
		},
		onHit(target, source) {
			target.side.removeSideCondition('reflect');
			target.side.removeSideCondition('lightscreen');
			target.side.removeSideCondition('auroraveil');
		},
		target: "normal",
		type: "Steel",
		contestType: "Tough",
	},
	titanbite: {
		accuracy: 80,
		basePower: 100,
		category: "Physical",
		name: "Titan Bite",
		pp: 10,
		priority: 0,
		flags: { contact: 1, protect: 1, mirror: 1, bite: 1 },
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Hyper Fang', target);
		},
		onHit(target, source) {
			const defensiveStats: ('def' | 'spd')[] = ['def', 'spd'];
			for (const stat of defensiveStats) {
				if (target.boosts[stat] > 0) {
					target.boosts[stat] = 0;
				}
			}
		},
		target: "normal",
		type: "Dark",
		contestType: "Tough",
	},
	foreshadow: {
		accuracy: 100,
		basePower: 120,
		category: 'Special',
		name: "Foreshadow",
		type: 'Dark',
		shortDesc: "Two turns after this move is used, a dark force attacks the target",
		pp: 10,
		priority: 0,
		gen: 9,
		flags: { futuremove: 1 },
		ignoreImmunity: true,
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Nightshade', target);
		},
		onTryMove(pokemon) {
			this.attrLastMove('[still]');
			if (!pokemon.side.addSideCondition('futuremove')) return false;
			Object.assign(pokemon.side.sideConditions['futuremove'], {
				duration: 3, // This sets the 2-turn delay!
				move: 'Foreshadow',
				source: pokemon,
				moveData: {
					id: 'foreshadow',
					name: "Foreshadow",
					accuracy: 100,
					basePower: 120,
					category: 'Special',
					type: 'Dark',
					flags: { futuremove: 1 },
					ignoreImmunity: true,
				},
			});
			this.add('-start', pokemon, 'move: Foreshadow');
			return null; // Prevents the move from executing immediately
		},
		target: 'normal',
	},
	unluckstrike: {
		name: "Unluck Strike",
		accuracy: 100,
		basePower: 100,
		category: "Special", // You can change this to "Physical" if you prefert
		pp: 1, // PP doesn't matter since the ability calls it automatically
		priority: 0,
		flags: { allyanim: 1, futuremove: 1 },
		damageCallback(pokemon, target) {
			// Returns a random integer between 50 and 150
			return this.random(50, 151);
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source, move) {
			this.add('-anim', source, 'Earthquake', target);
		},
		type: "???", // The typeless designation
		target: "normal",
	},
};

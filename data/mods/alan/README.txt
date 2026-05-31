How to add custom format to show in client side
1. Edit config/formats.ts
2. Go to the "export const Formats: FormatList = [];" section
3. Put the following code inside
    {
		section: "Custom Games",
	},
	{
		name: "[Gen 9] Alan Sandbox",
		desc: `use for testing, any moves and abilties to streamline testing`,
		mod: "alan",
		debug: true,
		ruleset: ['[Gen 9] Custom Game'],
	},

==================================================================
abilities.ts
For abilites 
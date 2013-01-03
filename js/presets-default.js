var Planets = {};


Planets.const = {

	/********* GAME CONSTANTS ********/

	//Time in ms it takes to change the planet ownership.
	planetOwnerChangeRate : 	10000,
	//Time in ms to spawn new ships.
	planetSpawnRate : 			20000,
	//If mor than planetSpawnMaxPresent ships of a fraction
	//are in orbit, stop spawning (overpopulation)
	planetMaxSpawnPresent : 	12,
	//Basevalue for ship speed
	shipBaseSpeed : 			70,
	//Random addition (0...n) to shipBaseSpeed
	shipRandomSpeed : 			30,
	//Time in ms between firing
	shipFireRate : 				4000,
	//Max. ship helath
	shipInitHealth : 			50,
	//Basedamage a missile does
	missileBaseDamage : 		10,
	//Random addition (0..n) to missileBaseDamage
	missileRandomDamage : 		5,

	/********* COLORS ********/
	planetForegroundColors : 	["rgb(232, 221, 203)",
								 "rgb(205, 179, 128)",
								 "rgb(  0, 180, 204)",
								 "rgb(240, 180, 158)"],
	planetConnectionColor : 	"rgba(255, 255, 255, 0.3)",
	planetPathColor : 			"rgba(255, 255, 255, 0.8)",
	planetDialBackground : 		"rgba(253, 253, 199, 0.2)",
	planetGlowColor0 : 			"rgba(211, 158, 114, 0.3)",
	planetGlowColor1 : 			"rgba(211, 158, 114, 0.0)",
	planetCoreColor : 			"rgba(253, 253, 199, 1)",
	shipExhaustColor : 			"rgba(255, 255, 255, 0.5)",
	missileColor : 				"rgba(255, 255, 255, 1.0)",
	viewportBackgroundColor : 	"rgba( 85,  98, 112, 1.0)",

	/********* EnemyAI ********/
	skynetConfig : {
		targetRatio : 0.5,		//the targeted ratio ownShips<>enemyShips for border planets
		emptyAmount : 2,		//the proposed enemy count for empty planets.
		baseAmount : 3, 			//the amount of ships on non-border planets
		maxTargets : 1,
		targetFail : -10,
		neighbourTroopEstimation : 0.1
	}

}

//Defines colors and names of the different fractions
var Fractions = [
	{
		color : "rgb(199, 244, 100)",
		name  : "Player"
	},
	{
		color : "rgb(255, 107, 107)",
		name  : "Enemy"
	},
	{
		color : "rgb(204, 166, 109)",
		name  : "Pirates"
	},
	{
		color : "rgb(255, 255, 255)",
		name  : "Neutral"
	}
];

//Defines the "Fractions's" indices
var Fraction = {
	Player : 0,
	Enemy : 1,
	Pirates: 2,
	Neutral : 3
};
var Planets = {};


Planets.const = {

	//idle time between update+render
	updateInterval : 			15,
	//size of the "hot corners" (for scrolling)
	hotCornerSize : 			30,
	//scroll speed
	scrollSpeed : 				4,
	/********* GAME CONSTANTS ********/

	//Time in ms it takes to change the planet ownership.
	planetOwnerChangeRate : 	10000,
	//Time in ms to spawn new ships.
	planetSpawnRate : 			20000,
	//If mor than planetSpawnMaxPresent ships of a fraction
	//are in orbit, stop spawning (overpopulation)
	planetSpawnMaxPresent : 	12,
	//Basevalue for ship speed
	shipBaseSpeed : 			80,
	//Random addition (0...n) to shipBaseSpeed
	shipRandomSpeed : 			30,
	//Influence of being in orbit on the ship speed
	shipOrbitSpeedMultiplicator:0.5,
	//Time in ms between firing
	shipFireRate : 				4000,
	//Max. ship helath
	shipInitHealth : 			50,
	//The lowest possible orbit
	shipOrbitOffsetMin : 		10,
	//The highest possible orbit
	shipOrbitOffsetMax : 		30,
	//Basedamage a missile does
	missileBaseDamage : 		10,
	//Random addition (0..n) to missileBaseDamage
	missileRandomDamage : 		5,
	//The missiles speed
	missileSpeed : 				80,

	/********* EnemyAI ********/
	skynetConfig : {
		//rate in ms in which the ai is called to update
		updateRate : 			500,
		//the targeted ratio ownShips<>enemyShips for border planets
		targetRatio : 			0.5,	
		//the proposed enemy count for empty planets	
		emptyAmount : 			2,	
		//the minimal amount of ships on non-border planets	
		baseAmount : 			3, 		
		//maximum number of targets to attack at the same time
		maxTargets : 			1,
		//retreat if enemy has to many ships
		targetFail : 			-10,
		//used to include the targets enemy-neighbour-troops 
		//into the attack-risk assessment
		//lower: more likely to attack / more aggressive. 
		neighbourTroopEstimation : 0.1
	},

	//Multiplicator for mouse wheel delta
	deltaDamping : 0.3,

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
	planetNameFillColor : 		 "rgb(255, 255, 255)",
	planetNameBorderColor : 	 "rgb(  0,   0,   0)",
	planetBorderColor : 		 "rgb(  0,   0,   0)",
	shipExhaustColor : 			"rgba(255, 255, 255, 0.5)",
	missileColor : 				"rgba(255, 255, 255, 1.0)",
	viewportBackgroundColor : 	"rgba(61,91,119, 1.0)",
	dragTargetBorderColor : 	 "rgb(  0,   0,   0)",
	dragTargetFillColor : 		"rgba(255, 255, 255, 0.6)",
	dragTargetFontColor :  		 "rgb(  0,   0,   0)",


	//http://de.wikipedia.org/wiki/Liste_von_Sternennamen	;-)
	planetNames : {
		prefix: [
					"Alpha", 
					"Beta", 
					"Zeta", 
					"Epsilon", 
					"Pi", 
					"Mon", 
					"Mir", 
					"Psi", 
					"Rho", 
					"Omikron",
				  	"Sigma", 
				  	"Xi", 
				  	"Cor"
				],
		postfix:[
					"Majoris", 
					"Minoris", 
					"Indi", 
					"Gamma", 
					"Cephei", 
					"A", 
					"B", 
					"C", 
					"Ceti", 
					"Delta",
					"Tauri", 
				  	"Capricorni", 
				  	"Lyrae"
				],
		names : [
					"Mensae", 
					"Pollux", 
					"Ursae", 
					"Leonis", 
					"Virginis", 
					"Draconis", 
					"Kappa", 
					"Coronae",
					"Herculis", 
					"Arae", 
					"Pegasi", 
					"Delphini", 
					"Aquarii", 
					"Orionis", 
					"Arietis", 
					"Librae",
					"Beteigeuze", 
					"Sol", 
					"Terra"
				]
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


var Keys = {
	LEFT : 37,
	RIGHT : 39,
	UP : 40,
	DOWN : 38,
	PAUSE : 27,
};
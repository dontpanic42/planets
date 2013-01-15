Planets.const.skynetConfig = {
	//rate in ms in which the ai is called to update
	updateRate : 			500,
	//the targeted ratio ownShips<>enemyShips for border planets
	targetRatio : 			0.5,	
	//the proposed enemy count for empty planets	
	emptyAmount : 			4,	
	//the minimal amount of ships on non-border planets	
	baseAmount : 			6, 		
	//maximum number of targets to attack at the same time
	maxTargets : 			1,
	//retreat if enemy has to many ships
	targetFail : 			-10,
	//used to include the targets enemy-neighbour-troops 
	//into the attack-risk assessment
	//lower: more likely to attack / more aggressive. 
	neighbourTroopEstimation : 0.6
};
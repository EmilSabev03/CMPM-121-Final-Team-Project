class Play extends Phaser.Scene {
    init() {
        //Initialize variables
        this.VEL = 200;        //Player speed
        this.timeElapsed = 0;  //Time starts at 0
        this.lastTimeIncrement = 0;
        this.timeInterval = 1000;
        this.totalWater = 0; //Total water level to 0
        this.sunLevel = 0; //Sun level to 0
        this.randomWater = 0; //Random water level set to 0
        this.tilledSoilData = {}; //Data that tilled soil tiles have
        this.tileSize = 32; //Setting tile size to 32 pixels
    }

    preload() {
        //Load tilemap, player, tileset, and plant assets
        this.load.tilemapTiledJSON('gameMap', 'assets/gamemaptest6.tmj');

        this.load.image('player', 'assets/player.png');

        this.load.image('tileset1', 'assets/farming_fishing.png');
        this.load.image('tileset2', 'assets/fence_alt.png');
        this.load.image('tileset5', 'assets/plowed_soil.png');
        this.load.image('tileset7', 'assets/reed.png');
        this.load.image('tileset8', 'assets/sand.png');
        this.load.image('tileset9', 'assets/sandwater.png');
        this.load.image('tileset11', 'assets/tileset_preview.png');

        this.load.image('plant1a', 'assets/plant_1A.png');
        this.load.image('plant1b', 'assets/plant_1B.png');
        this.load.image('plant1c', 'assets/plant_1C.png');
        this.load.image('plant1d', 'assets/plant_1D.png');

        this.load.image('plant2a', 'assets/plant_2A.png');
        this.load.image('plant2b', 'assets/plant_2B.png');
        this.load.image('plant2c', 'assets/plant_2C.png');
        this.load.image('plant2d', 'assets/plant_2D.png');

        this.load.image('plant3a', 'assets/plant_3A.png');
        this.load.image('plant3b', 'assets/plant_3B.png');
        this.load.image('plant3c', 'assets/plant_3C.png');
        this.load.image('plant3d', 'assets/plant_3D.png');
    }

    create() {
        //Movement directions and plant/reap
        this.cursors = this.input.keyboard.addKeys({
            'up': Phaser.Input.Keyboard.KeyCodes.W,
            'down': Phaser.Input.Keyboard.KeyCodes.S,
            'left': Phaser.Input.Keyboard.KeyCodes.A,
            'right': Phaser.Input.Keyboard.KeyCodes.D,
            'plant': Phaser.Input.Keyboard.KeyCodes.R,
            'reap': Phaser.Input.Keyboard.KeyCodes.F,
            'incrementTime': Phaser.Input.Keyboard.KeyCodes.T
        });

        //Add map to scene
        this.map = this.make.tilemap({ key: 'gameMap' });

        //Add tilesets to be used in layers
        const tileset1 = this.map.addTilesetImage('farming_fishing', 'tileset1');
        const tileset2 = this.map.addTilesetImage('fence_alt', 'tileset2');
        const tileset5 = this.map.addTilesetImage('plowed_soil', 'tileset5');
        const tileset7 = this.map.addTilesetImage('reed', 'tileset7');
        const tileset8 = this.map.addTilesetImage('sand', 'tileset8');
        const tileset9 = this.map.addTilesetImage('sandwater', 'tileset9');
        const tileset11 = this.map.addTilesetImage('tileset_preview', 'tileset11');

        //Define each tile layer and handle collision
        const tileLayer1 = this.map.createLayer('Tile Layer 1', [tileset11, tileset5], 0, 0);
        const tileLayer2 = this.map.createLayer('Tile Layer 2', [tileset8], 0, 0);
        const tileLayer4 = this.map.createLayer('Tile Layer 4', [tileset7, tileset11], 0, 0);

        this.farmingLayer = this.map.createLayer('Farming Layer', tileset5, 0, 0);

        const collisionLayer = this.map.createLayer('Collision Layer 1', [tileset1, tileset11, tileset2, tileset9], 0, 0);
        const collisionLayer2 = this.map.createLayer('Collision Layer 2', [tileset1, tileset11, tileset2, tileset7], 0, 0);

        if (collisionLayer && collisionLayer2)
        {
            collisionLayer.setCollisionByExclusion([-1]);
            collisionLayer2.setCollisionByExclusion([-1]);
        }

        //Add player to scene and allow player collision and player camera movement
        this.player = this.physics.add.sprite(1200, 1600, 'player', 0);
        this.player.body.setCollideWorldBounds(true);
        this.player.setScale(1);

        this.cameras.main.startFollow(this.player, true);

        this.physics.add.collider(this.player, collisionLayer);
        this.physics.add.collider(this.player, collisionLayer2);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        this.infoText = this.add.text(this.cameras.main.worldView.centerX, this.cameras.main.worldView.centerY - 250, `Time: 00:00`, {
            fontSize: '50px',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);

        this.initTilledSoilData();

        this.drawGrid();


    }

    update() 
{
    this.direction = new Phaser.Math.Vector2(0);

    if (this.cursors.left.isDown) {
        this.direction.x = -1;
    } else if (this.cursors.right.isDown) {
        this.direction.x = 1;
    }

    if (this.cursors.up.isDown) {
        this.direction.y = -1;
    } else if (this.cursors.down.isDown) {
        this.direction.y = 1;
    }

    this.direction.normalize();
    this.player.setVelocity(this.VEL * this.direction.x, this.VEL * this.direction.y);

    this.handlePlantingAndReaping();

    // Check if the number of 'D' plants is at least 5
    const numDPlants = this.countPlantsOfType('plant1d') + this.countPlantsOfType('plant2d') + this.countPlantsOfType('plant3d');
    if (numDPlants >= 5) {
        this.displayWinMessage();
    }

    // Increment time and other functions
    if (this.cursors.incrementTime.isDown && this.lastTimeIncrement <= 0) {
        this.timeElapsed += 1;
        this.updateTimeDisplay();
        this.lastTimeIncrement = this.timeInterval;

        for (const key in this.tilledSoilData) {
            const tileData = this.tilledSoilData[key];
            tileData.sunLevel += Math.floor(Math.random() * 10) + 1;
            tileData.waterLevel += Math.floor(Math.random() * 2) + 1;

            const [tileX, tileY] = key.split(',').map(Number);
            this.checkPlantGrowth(tileX, tileY);
            tileData.sunLevel = 0;
        }
    }

    if (this.lastTimeIncrement > 0) {
        this.lastTimeIncrement -= 100;
    }
    }

    handlePlantingAndReaping() {

        if (!this.farmingLayer)
        {
            return;
        }

        const tileSize = this.map.tileWidth;
    
        const playerTileX = Math.floor(this.player.x / tileSize);
        const playerTileY = Math.floor(this.player.y / tileSize);

        const farmingTile = this.farmingLayer.getTileAt(playerTileX, playerTileY);
        const canFarm = farmingTile !== null;
    
        const plantTypes = ['plant1a', 'plant2a', 'plant3a'];
    
        if (Phaser.Input.Keyboard.JustDown(this.cursors.plant)) {
            if (canFarm) {
                let existingPlant = null;
    
                //Check if a plant already exists on this tile
                if (this.plants) {
                    for (let i = 0; i < this.plants.length; i++) {
                        const plant = this.plants[i];
    
                        const plantTileX = Math.floor(plant.x / tileSize);
                        const plantTileY = Math.floor(plant.y / tileSize);
    
                        if (plantTileX === playerTileX && plantTileY === playerTileY) {
                            existingPlant = plant;
                            break;
                        }
                    }
                }
    
                //If a plant exists, destroy it and place a new one
                if (existingPlant) 
                {
                    existingPlant.destroy();

                    const index = this.plants.indexOf(existingPlant);
                    if (index !== -1) 
                    {
                        this.plants.splice(index, 1);
                    }
                }
    
                //Place a new random plant
                const randomPlantType = plantTypes[Math.floor(Math.random() * plantTypes.length)];
    
                const offsetX = 16;
                const offsetY = 16;
    
                const newPlant = this.add.sprite(
                    (playerTileX * tileSize) + offsetX,
                    (playerTileY * tileSize) + offsetY,
                    randomPlantType,
                );
    
                newPlant.setDepth(10);
    
                if (!this.plants) 
                {
                    this.plants = [];
                }
    
                this.plants.push(newPlant);
            }
        }
    
        if (Phaser.Input.Keyboard.JustDown(this.cursors.reap)) 
        {
            if (canFarm) 
            {
                if (this.plants) 
                {
                    for (let i = 0; i < this.plants.length; i++) 
                    {
                        const plant = this.plants[i];
                        const plantX = plant.x;
                        const plantY = plant.y;
    
                        if (Math.floor(plantX / tileSize) === playerTileX && Math.floor(plantY / tileSize) === playerTileY) 
                        {
                            plant.destroy();
                            this.plants.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }
    }


    initTilledSoilData() 
    {
        if (this.farmingLayer)
        {
            this.farmingLayer.forEachTile((tile) => 
            {
                if (tile.index !== -1) 
                { 
                    this.tilledSoilData[`${tile.x},${tile.y}`] = 
                    {
                        sunLevel: 0,
                        waterLevel: Math.floor(Math.random() * 2) + 1

                    };
                }
            });
        }
    }

    //Draws a grid overlay on the tilled soil spots that can have seeds planted on them
    drawGrid() 
    {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x00ff00, 0.5);

        const width = this.map.widthInPixels;
        const height = this.map.heightInPixels;

        for (let x = 1312; x <= 1888; x += this.tileSize) 
        {
            graphics.lineBetween(x, 1312, x, 1888);
        }

        for (let y = 1312; y <= 1888; y += this.tileSize) 
        {
            graphics.lineBetween(1312, y, 1888, y);
        }

        graphics.strokePath();
    }

    getTilledSoilData(tileX, tileY) 
    {
        const key = `${tileX},${tileY}`;
        return this.tilledSoilData[key] || null;
    }

    //Helper function to get the next upgrade level of a plant
    upgradePlantLevel(plant)
    {
        const plantUpgradeMap = 
        {
            plant1a: 'plant1b',
            plant1b: 'plant1c',
            plant1c: 'plant1d', 
            plant2a: 'plant2b',
            plant2b: 'plant2c',
            plant2c: 'plant2d', 
            plant3a: 'plant3b',
            plant3b: 'plant3c',
            plant3c: 'plant3d', 
        };

        const currentPlantType = plant.texture.key;

        if (plantUpgradeMap[currentPlantType])
        {
            return plantUpgradeMap[currentPlantType];
        }

        return currentPlantType;
    }

    updateTimeDisplay()
    {
        const minutes = Math.floor(this.timeElapsed / 60);
        const seconds = this.timeElapsed % 60;

        const timeString = `${this.padTime(minutes)}:${this.padTime(seconds)}`;
        this.infoText.setText(`Time: ${timeString}`);
    }

    padTime(time)
    {
        return time < 10 ? `0${time}` : time.toString();
    }

    //Checks if a plant is eligible to grow based on specific conditions
    checkPlantGrowth(tileX, tileY) 
    {
        const key = `${tileX},${tileY}`;
        const tileData = this.tilledSoilData[key];
    
        if (!tileData) return;
    
        const nearbyPlants = this.getNearbyPlants(tileX, tileY, 3);
        const waterRequirement = 5
        const sunRequirement = 5;
    
        //A plant can only grow if its sun level is >= 5, water level is >= 5, and there is at least one nearby plant
        if (tileData.sunLevel >= sunRequirement && tileData.waterLevel >= waterRequirement && nearbyPlants.length >= 2) 
        {
            tileData.sunLevel -= sunRequirement;
            tileData.waterLevel -= waterRequirement;
    
            const plant = this.getPlantAt(tileX, tileY);

            if (plant) 
            {
                const newTexture = this.upgradePlantLevel(plant);

                if (newTexture) 
                {
                    plant.setTexture(newTexture);
                }
            }
        }
    }
    
    //Checks if there are plants located next to another plant in a given tile range
    getNearbyPlants(tileX, tileY, range) 
    {
        if (!this.plants) return [];
    
        return this.plants.filter(plant => 
        {
            const plantTileX = Math.floor(plant.x / this.tileSize);
            const plantTileY = Math.floor(plant.y / this.tileSize);
    
            const distance = Math.sqrt(Math.pow(tileX - plantTileX, 2) + Math.pow(tileY - plantTileY, 2));
    
            return distance <= range;
        });
    }
    
    //Returns plant location
    getPlantAt(tileX, tileY) 
    {
        if (!this.plants) 
        {
            return null;
        }
    
        const tileSize = this.map.tileWidth;
    
        return this.plants.find(plant => 
        {
            const plantTileX = Math.floor(plant.x / tileSize);
            const plantTileY = Math.floor(plant.y / tileSize);
            return plantTileX === tileX && plantTileY === tileY;
        }) || null;
    }

    //Function that counts the amount of plants of each type
    countPlantsOfType(plantType) {
        let count = 0;
        if (this.plants) {
            this.plants.forEach(plant => {
                if (plant.texture.key === plantType) {
                    count++;
                }
            });
        }
        return count;
    }
    
    //Function that displays the win condition
    displayWinMessage() {
        this.infoText.setText("Phase 1 complete: Grew 5 level 4 plants");
        this.infoText.setStyle({ fontSize: '30px', fill: '#00ff00' });
    }
}
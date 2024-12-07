class Play extends Phaser.Scene {
    init() {
        // Initialize variables
        this.VEL = 200;        // Player speed
        this.timeElapsed = 0;  // Time starts at 0
        this.lastTimeIncrement = 0;
        this.timeInterval = 1000;
        this.totalWater = 0; // Total water level to 0
        this.sunLevel = 0; // Sun level to 0
        this.randomWater = 0; // Random water level set to 0
        this.tilledSoilData = {}; // Data that tilled soil tiles have
        this.tileSize = 32; // Setting tile size to 32 pixels
    }

    preload() {
        // Load tilemap, player, and tileset assets
        this.load.tilemapTiledJSON('gameMap', '../assets/gamemaptest6.tmj');
        this.load.image('player', '../assets/player.png');
        this.load.image('tileset1', '../assets/farming_fishing.png');
        this.load.image('tileset2', '../assets/fence_alt.png');
        this.load.image('tileset5', '../assets/plowed_soil.png');
        this.load.image('tileset7', '../assets/reed.png');
        this.load.image('tileset8', '../assets/sand.png');
        this.load.image('tileset9', '../assets/sandwater.png');
        this.load.image('tileset11', '../assets/tileset_preview.png');
    }

    create() {
        // Movement directions and plant/reap
        this.cursors = this.input.keyboard.addKeys({
            'up': Phaser.Input.Keyboard.KeyCodes.W,
            'down': Phaser.Input.Keyboard.KeyCodes.S,
            'left': Phaser.Input.Keyboard.KeyCodes.A,
            'right': Phaser.Input.Keyboard.KeyCodes.D,
            'plant': Phaser.Input.Keyboard.KeyCodes.R,
            'reap': Phaser.Input.Keyboard.KeyCodes.F,
            'incrementTime': Phaser.Input.Keyboard.KeyCodes.T
        });

        // Add map to scene
        this.map = this.make.tilemap({ key: 'gameMap' });

        // Add tilesets to be used in layers
        const tileset1 = this.map.addTilesetImage('farming_fishing', 'tileset1');
        const tileset2 = this.map.addTilesetImage('fence_alt', 'tileset2');
        const tileset5 = this.map.addTilesetImage('plowed_soil', 'tileset5');
        const tileset7 = this.map.addTilesetImage('reed', 'tileset7');
        const tileset8 = this.map.addTilesetImage('sand', 'tileset8');
        const tileset9 = this.map.addTilesetImage('sandwater', 'tileset9');
        const tileset11 = this.map.addTilesetImage('tileset_preview', 'tileset11');

        // Define each tile layer and handle collision
        const tileLayer1 = this.map.createLayer('Tile Layer 1', [tileset11, tileset5], 0, 0);
        const tileLayer2 = this.map.createLayer('Tile Layer 2', [tileset8], 0, 0);
        const tileLayer4 = this.map.createLayer('Tile Layer 4', [tileset7, tileset11], 0, 0);

        this.farmingLayer = this.map.createLayer('Farming Layer', tileset5, 0, 0);

        this.collisionLayer = this.map.createLayer('Collision Layer 1', [tileset1, tileset11, tileset2, tileset9], 0, 0);
        const collisionLayer2 = this.map.createLayer('Collision Layer 2', [tileset1, tileset11, tileset2, tileset7], 0, 0);

        this.collisionLayer.setCollisionByExclusion([-1]);
        collisionLayer2.setCollisionByExclusion([-1]);

        // Add player to scene and allow player collision and player camera movement
        this.player = this.physics.add.sprite(1200, 1600, 'player', 0);
        this.player.body.setCollideWorldBounds(true);
        this.player.setScale(1.5);

        this.cameras.main.startFollow(this.player, true);

        this.physics.add.collider(this.player, this.collisionLayer);
        this.physics.add.collider(this.player, collisionLayer2);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // Add text to the container for displaying time
        this.infoText = this.add.text(1030, 1300, `Time: ${this.timeElapsed}`, {
            fontSize: '50px',
            fill: '#ffffff'
        });

        // Initialize the tilled soil grid data
        this.initTilledSoilData();

        // Draw the grid overlay
        this.drawGrid();
    }

    update() {
        // Update player movement
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

        // Handle planting and reaping
        this.handlePlantingAndReaping();

        // Increment time when T is held down
        if (this.cursors.incrementTime.isDown && this.lastTimeIncrement <= 0) {
            this.timeElapsed += 1;  // Increment time by 1 each frame
            this.infoText.setText(`Time: ${this.timeElapsed}`);
            this.lastTimeIncrement = this.timeInterval;
            for (const key in this.tilledSoilData) {
                const tileData = this.tilledSoilData[key];
                tileData.sunLevel = Math.floor(Math.random() * 3) + 1; // Generate random sun level for each tile
                tileData.waterLevel += Math.floor(Math.random() * 2) + 1; // Generate random water level for each tile
                if (tileData.sunLevel > 0) { // if the sun level has sun stored remove it
                    tileData.sunLevel = 0;
                }
            }
        }
        if (this.lastTimeIncrement > 0) {
            this.lastTimeIncrement -= 100;
        }

        const tileX = Math.floor(this.player.x / this.tileSize);
        const tileY = Math.floor(this.player.y / this.tileSize);

        const currentTileData = this.getTilledSoilData(tileX, tileY);
        if (currentTileData) {
            console.log(
                `Current Tile Sun: ${currentTileData.sunLevel}, Water: ${currentTileData.waterLevel}`
            );
        }
    }

    handlePlantingAndReaping() {
        const tileSize = this.map.tileWidth;
        const playerTileX = Math.floor(this.player.x / tileSize);
        const playerTileY = Math.floor(this.player.y / tileSize);

        const farmingTile = this.farmingLayer.getTileAt(playerTileX, playerTileY);
        const canFarm = farmingTile !== null;

        if (Phaser.Input.Keyboard.JustDown(this.cursors.plant)) {
            if (canFarm) {
                const plant = this.add.graphics();
                plant.fillStyle(0x00FF00, 1);
                plant.fillRect(playerTileX * tileSize, playerTileY * tileSize, tileSize, tileSize);

                plant.setData('tileX', playerTileX);
                plant.setData('tileY', playerTileY);

                if (!this.plants) {
                    this.plants = [];
                }

                this.plants.push(plant);
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.reap)) {
            if (canFarm) {
                if (this.plants) {
                    for (let i = 0; i < this.plants.length; i++) {
                        const plant = this.plants[i];
                        const plantX = plant.getData('tileX');
                        const plantY = plant.getData('tileY');

                        if (plantX === playerTileX && plantY === playerTileY) {
                            plant.destroy();
                            this.plants.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }
    }

    initTilledSoilData() {
        // Iterate through all tiles in the farming layer
        this.farmingLayer.forEachTile((tile) => {
            if (tile.index !== -1) { // Don't use the empty tiles
                // Store only the tiles from`tileset5`
                this.tilledSoilData[`${tile.x},${tile.y}`] = {
                    sunLevel: 0,
                    waterLevel: Math.floor(Math.random() * 2) + 1

                };
            }
        });
    }

    //Draws a grid overlay on the tilled soil spots that can have seeds planted on them
    drawGrid() {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x00ff00, 0.5);

        const width = this.map.widthInPixels;
        const height = this.map.heightInPixels;

        // Draws vertical lines
        for (let x = 1312; x <= 1888; x += this.tileSize) {
            graphics.lineBetween(x, 1312, x, 1888);
        }

        // Draws horizontal lines
        for (let y = 1312; y <= 1888; y += this.tileSize) {
            graphics.lineBetween(1312, y, 1888, y);
        }

        graphics.strokePath();
    }

    //Gets the data from the tilled soil at the specified location
    getTilledSoilData(tileX, tileY) {
        const key = `${tileX},${tileY}`;
        return this.tilledSoilData[key] || null;
    }


    //Updates the data for the tilled soil at the specified location
    updateTilledSoilData(tileX, tileY, newData) {
        const key = `${tileX},${tileY}`;
        if (this.tilledSoilData[key]) {
            Object.assign(this.tilledSoilData[key], newData);
        }
    }
}
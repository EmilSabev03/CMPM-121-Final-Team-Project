class Play extends Phaser.Scene {
    init() {
        // Player speed
        this.VEL = 200;
    }

    preload() {
        // Load tilemap, player, and tileset assets
        this.load.tilemapTiledJSON('gameMap', '../assets/gamemaptest5.tmj');
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
            'plant': Phaser.Input.Keyboard.KeyCodes.J,
            'reap': Phaser.Input.Keyboard.KeyCodes.K
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
    }

    update() {
        // Update the direction that the player is moving in on screen
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
    }

    handlePlantingAndReaping() {
        const tileSize = this.map.tileWidth;
        const playerTileX = Math.floor(this.player.x / tileSize);
        const playerTileY = Math.floor(this.player.y / tileSize);
        
        // Handle planting (J key)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.plant)) {
            console.log("Plant key pressed!");
            
            // Spawn a placeholder rectangle (green) where the player is
            const plant = this.add.graphics();
            plant.fillStyle(0x00FF00, 1);  // Green color
            plant.fillRect(playerTileX * tileSize, playerTileY * tileSize, tileSize, tileSize);
            
            // Optionally store the plant in a variable if you want to manage it later
            plant.setData('tileX', playerTileX);
            plant.setData('tileY', playerTileY);
            
            // Store the plant object in a map (or similar structure) so we can refer to it later
            // You can store it globally or in a scene object (like this.plants)
            if (!this.plants) {
                this.plants = [];
            }
            this.plants.push(plant);  // Add the new plant to the plants array
        }
        
        // Handle reaping (K key)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.reap)) {
            console.log("Reap key pressed!");
    
            // Loop through the plants array to find any plant at the player's position
            if (this.plants) {
                for (let i = 0; i < this.plants.length; i++) {
                    const plant = this.plants[i];
                    const plantX = plant.getData('tileX');
                    const plantY = plant.getData('tileY');
                    
                    // If the plant is at the player's position, remove it
                    if (plantX === playerTileX && plantY === playerTileY) {
                        console.log(`Reaping plant at (${plantX}, ${plantY})`);
                        plant.destroy();  // Remove the plant graphics
                        this.plants.splice(i, 1);  // Remove the plant from the array
                        break;  // Stop looking for more plants after the first one is reaped
                    }
                }
            }
        }
    }
    
    
}

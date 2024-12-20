class Play extends Phaser.Scene 
{
    init() {
        //Initialize variables
        this.VEL = 200;       

        this.timeElapsed = 0; 
        this.lastTimeIncrement = 0;
        this.timeInterval = 1000;

        this.tilledSoilData = {}; 

        this.tileSize = 32; 
        this.tileDataSize = 4;
        this.playerDataSize = 8;
        this.timeDataSize = 4;

        this.maxPlants = 324;
        this.plantDataSize = 12;

        this.gameStateSize = this.playerDataSize + (this.maxPlants * this.plantDataSize) + this.timeDataSize;
        this.gameStateBuffer = new ArrayBuffer(this.gameStateSize);
        this.view = new DataView(this.gameStateBuffer);

        this.saveMenu = null;

        this.undoStack = [];
        this.redoStack = [];
    }

    preload() {
        //Load translations
        this.load.json('translations', 'assets/translations.json');

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
        // Access translations and set default language
        this.translations = this.cache.json.get('translations');
        this.selectedLanguage = 'en'; // Default language

        // Add key bindings for language selection
        this.createKeyBindings();


        //Movement directions and plant/reap
        this.cursors = this.input.keyboard.addKeys({
            'up': Phaser.Input.Keyboard.KeyCodes.W,
            'down': Phaser.Input.Keyboard.KeyCodes.S,
            'left': Phaser.Input.Keyboard.KeyCodes.A,
            'right': Phaser.Input.Keyboard.KeyCodes.D,
            'plant': Phaser.Input.Keyboard.KeyCodes.R,
            'reap': Phaser.Input.Keyboard.KeyCodes.F,
            'incrementTime': Phaser.Input.Keyboard.KeyCodes.T,
            'saveGameState': Phaser.Input.Keyboard.KeyCodes.K,
            'displayMenu': Phaser.Input.Keyboard.KeyCodes.M,
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

        const instructionStyle = { fontSize: '16px', fill: '#ffffff', align: 'right' };
        const mechanicsText = this.getText('mechanics')
        this.add.text(this.cameras.main.worldView.width - 20, 20, mechanicsText, instructionStyle).setOrigin(1, 0).setScrollFactor(0);

        this.initTilledSoilData();
        this.drawGrid();

        //Load the default saved state 
        const savedState = localStorage.getItem('gameState');

        if (!localStorage.getItem('manualSaves'))
        {
            localStorage.setItem('manualSaves', JSON.stringify([]));
        }
        
        const savedStates = JSON.parse(localStorage.getItem('manualSaves' || '[]'));
        
        //If a saved state exists, use the most recent one based on the timestamp of the save
        if (savedStates.length > 0)
        {
            const latestSave = savedStates.reduce((latest, current) => new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest);
            this.loadGameState(new Uint8Array(latestSave.data));
        }

        else
        {
            const savedState = localStorage.getItem('gameState');
            if (savedState) { this.loadGameState(new Uint8Array(JSON.parse(savedState))); }
        }  

        //Upon refresh/reopen, the player can choose if they want to continue from the autosave or the last manual save
        const autoSavedData = localStorage.getItem('autoSave');

        if (autoSavedData)
        {
            const continueGame = confirm("Do you want to continue where you left off?");

            if (continueGame)
            {
                this.loadGameState(new Uint8Array(JSON.parse(autoSavedData)));
            }

            else
            {
                const defaultSave = localStorage.getItem('gameState');

                if (defaultSave)
                {
                    this.loadGameState(new Uint8Array(JSON.parse(defaultSave)));
                }
            }
        }

        const savedUndoStack = localStorage.getItem('undoStack');
        const savedRedoStack = localStorage.getItem('redoStack');

        this.undoStack = savedUndoStack ? JSON.parse(savedUndoStack) : [];
        this.redoStack = savedRedoStack ? JSON.parse(savedRedoStack) : [];
    }


    update() 
    {
        //Update player movement
        this.direction = new Phaser.Math.Vector2(0);
    
        if (this.cursors.left.isDown || this.cursors.left.isDown === true) {
            this.direction.x = -1;
        } else if (this.cursors.right.isDown || this.cursors.right.isDown === true) {
            this.direction.x = 1;
        }
    
        if (this.cursors.up.isDown) {
            this.direction.y = -1;
        } else if (this.cursors.down.isDown) {
            this.direction.y = 1;
        }
    
        this.direction.normalize();
        this.player.setVelocity(this.VEL * this.direction.x, this.VEL * this.direction.y);
    
        //Save game state when K is pressed
        if (Phaser.Input.Keyboard.JustDown(this.cursors.saveGameState)) 
        {
            const saveKey = `manualSave_${new Date().getTime()}`;
            this.updateGameState(saveKey);
        }
    
        //Display save menu when M is pressed
        if (Phaser.Input.Keyboard.JustDown(this.cursors.displayMenu)) 
        {
            this.displaySavesMenu();
        }
    
        this.handlePlantingAndReaping();
    
        const numDPlants = this.countPlantsOfType('plant1d') + this.countPlantsOfType('plant2d') + this.countPlantsOfType('plant3d');

        if (numDPlants >= 5) 
        {
            this.displayWinMessage();
        }
    
        if (this.cursors.incrementTime.isDown && this.lastTimeIncrement <= 0) 
        {
            this.saveToUndoStack();
            this.timeElapsed += 1;
            this.updateTimeDisplay();
            this.lastTimeIncrement = this.timeInterval;
    
            for (const key in this.tilledSoilData) 
            {
                const tileData = this.tilledSoilData[key];
                tileData.sunLevel += Math.floor(Math.random() * 10) + 1;
                tileData.waterLevel += Math.floor(Math.random() * 2) + 1;
    
                const [tileX, tileY] = key.split(',').map(Number);
                this.checkPlantGrowth(tileX, tileY);
                tileData.sunLevel = 0;
            }
        }
    
        if (this.lastTimeIncrement > 0) 
        {
            this.lastTimeIncrement -= 100;
        }
    
        this.autoSaveGameState();
    }
    

    displaySavesMenu() 
    {
        if (this.saveMenu) 
        {
            this.saveMenu.destroy();
            this.saveMenu = null;
            return;
        }
    
        const savedStates = JSON.parse(localStorage.getItem('manualSaves') || '[]');
    
        const menuBackground = this.add.rectangle
        (
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            500,
            400,
            0x000000,
            0.8
        ).setOrigin(0.5).setScrollFactor(0);
    
        const menuTitle = this.add.text
        (
            this.cameras.main.centerX,
            this.cameras.main.centerY - 180,
            'Saved Game States',
            { fontSize: '20px', fill: '#ffffff' }
        ).setOrigin(0.5).setScrollFactor(0);
    
        this.saveMenu = this.add.container(0, 0, [menuBackground, menuTitle]);
    
        //Clear button to delete all saves and reset the game's state
        const clearAllButton = this.add.text
        (
            this.cameras.main.centerX,
            this.cameras.main.centerY - 150,
            'Clear All Saves',
            { fontSize: '16px', fill: '#ff4444' }
        ).setOrigin(0.5).setInteractive().setScrollFactor(0);
    
        clearAllButton.on('pointerdown', () => 
        {
            localStorage.setItem('manualSaves', JSON.stringify([]));
            localStorage.removeItem('gameState'); 

            this.undoStack = [];
            this.redoStack = [];
            localStorage.removeItem('undoStack');
            localStorage.removeItem('redoStack');
            
            console.log('All saved states cleared. Game resetting to initial state.');
            
            this.timeElapsed = 0;
            this.lastTimeIncrement = 0;
            this.tilledSoilData = {};
            
            if (this.plants && this.plants.length > 0) 
            {
                this.plants.forEach(plant => plant.destroy()); 
                this.plants = [];
            }
        
            this.player.setPosition(1200, 1600);
            this.initTilledSoilData(); 
            this.updateTimeDisplay(); 

            this.infoText.setStyle({
                fontSize: '50px',
                fill: '#ffffff'
            });
            
            this.displaySavesMenu();
        });
            
        this.saveMenu.add(clearAllButton);
    
        const closeMenuButton = this.add.text
        (
            this.cameras.main.centerX,
            this.cameras.main.centerY + 160,
            'Close',
            { fontSize: '16px', fill: '#ffffff' }
        ).setOrigin(0.5).setInteractive().setScrollFactor(0);
    
        closeMenuButton.on('pointerdown', () => 
        {
            this.saveMenu.destroy();
            this.saveMenu = null;
        });

        this.saveMenu.add(closeMenuButton);

        const startY = this.cameras.main.centerY - 80; 
        const saveEntryHeight = 30;
    
        //Add saves and load functionality
        savedStates.forEach((save, index) => 
        {
            const saveText = this.add.text
            (
                this.cameras.main.centerX - 180,
                startY + index * saveEntryHeight - 30,
                `${save.saveKey} (${new Date(save.timestamp).toLocaleString()})`,
                { fontSize: '14px', fill: '#ffffff' }
            ).setOrigin(0).setScrollFactor(0);
    
            const loadButton = this.add.text
            (
                this.cameras.main.centerX - 215,
                startY + index * saveEntryHeight - 22,
                'Load',
                { fontSize: '14px', fill: '#00ff00' }
            ).setOrigin(0.5).setInteractive().setScrollFactor(0);
    
            loadButton.on('pointerdown', () => 
            {
                this.loadGameState(new Uint8Array(save.data));
                this.saveMenu.destroy();
                this.saveMenu = null;
            });
    
            this.saveMenu.add([saveText, loadButton]);
        });

        //Undo/redo functionality in the menu
        const undoButton = this.add.text(
            this.cameras.main.centerX - 120,
            this.cameras.main.centerY + 160,
            'Undo',
            { fontSize: '16px', fill: '#0000FF' }
        ).setOrigin(0.5).setInteractive().setScrollFactor(0);
        
        undoButton.on('pointerdown', () => this.undo());
        this.saveMenu.add(undoButton);
        
        const redoButton = this.add.text(
            this.cameras.main.centerX + 120,
            this.cameras.main.centerY + 160,
            'Redo',
            { fontSize: '16px', fill: '#0000FF' }
        ).setOrigin(0.5).setInteractive().setScrollFactor(0);
        
        redoButton.on('pointerdown', () => this.redo());
        this.saveMenu.add(redoButton);
        
    
        //If no saves exist, display an empty menu
        if (savedStates.length === 0) 
        {
            const noSavesText = this.add.text
            (
                this.cameras.main.centerX,
                startY + 50,
                'No saved states available.',
                { fontSize: '14px', fill: '#ffffff' }
            ).setOrigin(0.5).setScrollFactor(0);
    
            this.saveMenu.add(noSavesText);
        }
    }


    //Function to automatically save the game's state, used in update() every frame
    autoSaveGameState()
    {
        const view = new Uint8Array(this.gameStateBuffer);
        let offset = 0;

        const playerData = 
        {
            playerX: this.player.x,
            playerY: this.player.y,
            timeElapsed: this.timeElapsed,
        };

        view[offset++] = playerData.playerX & 0xFF;
        view[offset++] = (playerData.playerX >> 8) & 0xFF;
        view[offset++] = playerData.playerY & 0xFF;
        view[offset++] = (playerData.playerY >> 8) & 0xFF;
        view[offset++] = playerData.timeElapsed & 0xFF;
        view[offset++] = (playerData.timeElapsed >> 8) & 0xFF;

        for (const [key, tileData] of Object.entries(this.tilledSoilData)) 
        {
            const [tileX, tileY] = key.split(',').map(Number);
            const plantTypeInt = tileData.plantType || 0;
            const sunLevel = Math.min(tileData.sunLevel || 0, 255);
            const waterLevel = Math.min(tileData.waterLevel || 0, 255);
    
            view.set([tileX, tileY, plantTypeInt, sunLevel, waterLevel], offset);
            offset += 5;
        }

        try 
        {
            localStorage.setItem('autoSave', JSON.stringify(Array.from(view)));
        }

        catch (error)
        {
            console.error('Failed to auto save game state:', error);
        }


    }


    updateGameState(saveKey = 'gameState') 
    {
        //Create AoS byte array
        const view = new Uint8Array(this.gameStateBuffer);
        let offset = 0;
    
        const playerData = 
        {
            playerX: this.player.x,
            playerY: this.player.y,
            timeElapsed: this.timeElapsed,
        };
    
       //Save player data {playerX, playerY, timeElapsed}, and soil tile data {plantType, sunLevel, waterLevel} in byte array
        view[offset++] = playerData.playerX & 0xFF;
        view[offset++] = (playerData.playerX >> 8) & 0xFF;
        view[offset++] = playerData.playerY & 0xFF;
        view[offset++] = (playerData.playerY >> 8) & 0xFF;
        view[offset++] = playerData.timeElapsed & 0xFF;
        view[offset++] = (playerData.timeElapsed >> 8) & 0xFF;
    
        for (const [key, tileData] of Object.entries(this.tilledSoilData)) 
        {
            const [tileX, tileY] = key.split(',').map(Number);
            const plantTypeInt = tileData.plantType || 0;
            const sunLevel = Math.min(tileData.sunLevel || 0, 255);
            const waterLevel = Math.min(tileData.waterLevel || 0, 255);
    
            view.set([tileX, tileY, plantTypeInt, sunLevel, waterLevel], offset);
            offset += 5;
        }
    
        //Save the game state (key, data, and timestamp) to the manual saves array
        const savedStates = JSON.parse(localStorage.getItem('manualSaves') || '[]');
        savedStates.push({ saveKey, data: Array.from(view), timestamp: new Date().toISOString() });
    
        //Save manual saves array and update default game state
        try 
        {
            localStorage.setItem('manualSaves', JSON.stringify(savedStates));
            localStorage.setItem('gameState', JSON.stringify(Array.from(view)));
            console.log(`Game state saved under key: ${saveKey}`);
        } 
        
        catch (error)
        {
            console.error('Failed to save game state:', error);
        }
    }
    
    
    loadGameState(savedData) 
    {
        //Check if saved state exists
        if (!savedData || savedData.length < 6) 
        {
            this.player.x = 1200;
            this.player.y = 1600;
            return;
        }

        if (this.plants && this.plants.length > 0) 
        {
            this.plants.forEach(plant => plant.destroy());
            this.plants = [];
        }

        this.tilledSoilData = {};

        //Load player position, time elapsed, and soil tile data from local storage
        let offset = 0;

        this.player.x = savedData[offset++] | (savedData[offset++] << 8);
        this.player.y = savedData[offset++] | (savedData[offset++] << 8);

        this.timeElapsed = savedData[offset++] | (savedData[offset++] << 8);
        this.updateTimeDisplay();

        while (offset < savedData.length) 
        {
            const tileX = savedData[offset++];
            const tileY = savedData[offset++];
            const plantTypeInt = savedData[offset++];
            const sunLevel = savedData[offset++];
            const waterLevel = savedData[offset++];

            const key = `${tileX},${tileY}`;

            if (!this.tilledSoilData[key])
            {
                this.tilledSoilData[key] = {};
            }

            this.tilledSoilData[key].plantType = plantTypeInt;
            this.tilledSoilData[key].sunLevel = sunLevel;
            this.tilledSoilData[key].waterLevel = waterLevel;

            //Add plant sprite
            if (plantTypeInt > 0)
            {
                const plantType = this.intToPlantType(plantTypeInt);

                const plantSprite = this.add.sprite(tileX * this.tileSize + 16, tileY * this.tileSize + 16, plantType);
                plantSprite.setData('tileKey', key);

                if (!this.plants) 
                {
                    this.plants = [];
                }

                this.plants.push(plantSprite);
            }
        }
    }
    

    saveToUndoStack() 
    {
        const currentState = JSON.stringify(this.tilledSoilData);
        this.undoStack.push(currentState);
        this.redoStack = []; 
    
        localStorage.setItem('undoStack', JSON.stringify(this.undoStack));
        localStorage.setItem('redoStack', JSON.stringify(this.redoStack));
    }
    
    
    undo() 
    {
        if (this.undoStack.length > 0) 
        {
            const currentState = JSON.stringify(this.tilledSoilData);
            this.redoStack.push(currentState);
    
            const previousState = this.undoStack.pop();
            this.tilledSoilData = JSON.parse(previousState);
    
            localStorage.setItem('undoStack', JSON.stringify(this.undoStack));
            localStorage.setItem('redoStack', JSON.stringify(this.redoStack));
    
            this.refreshPlants();
        }
    }
    
    
    redo() 
    {
        if (this.redoStack.length > 0) 
        {
            const currentState = JSON.stringify(this.tilledSoilData);
            this.undoStack.push(currentState);
    
            const nextState = this.redoStack.pop();
            this.tilledSoilData = JSON.parse(nextState);
    
            localStorage.setItem('undoStack', JSON.stringify(this.undoStack));
            localStorage.setItem('redoStack', JSON.stringify(this.redoStack));
    
            this.refreshPlants();
        }
    }
    
    
    refreshPlants() 
    {
        if (this.plants) 
        {
            this.plants.forEach(plant => plant.destroy());
        }

        this.plants = [];
    
        for (const [key, tileData] of Object.entries(this.tilledSoilData)) 
            {

            const [tileX, tileY] = key.split(',').map(Number);
            if (tileData.plantType > 0) 
            {
                const plantType = this.intToPlantType(tileData.plantType);
                const plantSprite = this.add.sprite
                (
                    tileX * this.tileSize + 16,
                    tileY * this.tileSize + 16,
                    plantType
                );

                plantSprite.setData('tileKey', key);
                this.plants.push(plantSprite);
            }
        }
    }
    

    
    //Helper functions for plant type conversion
    plantTypeToInt(plantType) 
    {
        const plantTypes = 
        [
            'plant1a', 'plant1b', 'plant1c', 'plant1d',
            'plant2a', 'plant2b', 'plant2c', 'plant2d',
            'plant3a', 'plant3b', 'plant3c', 'plant3d'
        ];

        return plantTypes.indexOf(plantType) + 1;
    }

    
    intToPlantType(plantInt) 
    {
        const plantTypes = 
        [
            'plant1a', 'plant1b', 'plant1c', 'plant1d',
            'plant2a', 'plant2b', 'plant2c', 'plant2d',
            'plant3a', 'plant3b', 'plant3c', 'plant3d'
        ];

        return plantTypes[plantInt - 1] || null;
    }

    
    handlePlantingAndReaping() 
    {
        const playerTileX = Math.floor(this.player.x / this.tileSize);
        const playerTileY = Math.floor(this.player.y / this.tileSize);
        const tileKey = `${playerTileX},${playerTileY}`;
    
        if (!this.tilledSoilData[tileKey]) return;
    
        if (Phaser.Input.Keyboard.JustDown(this.cursors.plant)) {
            const plantTypes = ['plant1a', 'plant2a', 'plant3a'];
            const randomPlantType = plantTypes[Math.floor(Math.random() * plantTypes.length)];
    
            if (this.tilledSoilData[tileKey].plantType === 0) {
                this.saveToUndoStack(); 
    
                this.tilledSoilData[tileKey].plantType = this.plantTypeToInt(randomPlantType);
    
                const plantSprite = this.add.sprite(
                    playerTileX * this.tileSize + 16,
                    playerTileY * this.tileSize + 16,
                    randomPlantType
                );
    
                if (!this.plants) this.plants = [];
                plantSprite.setData('tileKey', tileKey);
                this.plants.push(plantSprite);
            }
        }
    
        if (Phaser.Input.Keyboard.JustDown(this.cursors.reap)) {
            if (this.tilledSoilData[tileKey].plantType !== 0) {
                this.saveToUndoStack(); 
    
                this.tilledSoilData[tileKey].plantType = 0;
    
                if (this.plants) {
                    for (let i = 0; i < this.plants.length; i++) {
                        const plantSprite = this.plants[i];
                        if (plantSprite.getData('tileKey') === tileKey) {
                            plantSprite.destroy();
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
        this.farmingLayer.forEachTile((tile) => 
        {
            if (tile.index !== -1) 
            {
                const key = `${tile.x},${tile.y}`;

                this.tilledSoilData[key] = 
                {
                    sunLevel: 0,
                    waterLevel: Math.floor(Math.random() * 2) + 1,
                    plantType: 0
                };
            }
        });
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
            plant1a: 'plant1b', plant1b: 'plant1c', plant1c: 'plant1d', 
            plant2a: 'plant2b', plant2b: 'plant2c', plant2c: 'plant2d', 
            plant3a: 'plant3b', plant3b: 'plant3c', plant3c: 'plant3d', 
        };

        const currentPlantType = plant.texture.key;

        if (plantUpgradeMap[currentPlantType])
        {
            return plantUpgradeMap[currentPlantType];
        }

        return currentPlantType;
    }


    updateTimeDisplay() {
        const minutes = Math.floor((this.timeElapsed || 0) / 60);
        const seconds = (this.timeElapsed || 0) % 60;

        const timeString = this.getText('time', { minutes, seconds });
        this.infoText.setText(timeString);
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
    
        if (!tileData || tileData.plantType === 0)
        {
            return;
        }
    
        const nearbyPlants = this.getNearbyPlants(tileX, tileY, 3);
        const waterRequirement = 5;
        const sunRequirement = 5;
    
        if (tileData.sunLevel >= sunRequirement && tileData.waterLevel >= waterRequirement && nearbyPlants.length >= 2) 
        {   
            tileData.sunLevel -= sunRequirement;
            tileData.waterLevel -= waterRequirement;
    
            const plant = this.getPlantAt(tileX, tileY);
    
            if (plant) 
            {
                const currentPlantType = this.intToPlantType(tileData.plantType);
                const newTexture = this.upgradePlantLevel({ texture: { key: currentPlantType } });
    
                if (newTexture) 
                {
                    tileData.plantType = this.plantTypeToInt(newTexture); 
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

    createKeyBindings() {
        // Map keys 1, 2, and 3 to languages
        this.input.keyboard.on('keydown-ONE', () => this.setLanguage('en'));
        this.input.keyboard.on('keydown-TWO', () => this.setLanguage('zh'));
        this.input.keyboard.on('keydown-THREE', () => this.setLanguage('ar'));
        this.input.keyboard.on('keydown-FOUR', () => this.setLanguage('es'));



    }

    setLanguage(languageCode) {
        if (this.translations[languageCode]) {
            this.selectedLanguage = languageCode;
            // Update existing text to reflect the new language
            this.updateDisplayedText();
        } else {
            console.warn(`Language ${languageCode} not supported.`);
        }
    }

    updateDisplayedText() {
        // Update the info text with the new language
        this.updateTimeDisplay();
        this.updateMechanicsMessage();
    }
    updateMechanicsMessage() {
        const mechMessage = this.getText('mechanics');
        this.mechanicsText.setText(mechMessage);
    }

    getText(key, params = {}) {
        const text = this.translations[this.selectedLanguage][key] || key;
        return text.replace(/{(\w+)}/g, (_, match) => params[match] || '');
    }
    

    //Function that displays the win condition
    displayWinMessage() {
        const winMessage = this.getText('winMessage'); // Fetch the localized win message
        this.infoText.setText(winMessage);
        this.infoText.setStyle({ fontSize: '20px', fill: '#00ff00' });
    }
}
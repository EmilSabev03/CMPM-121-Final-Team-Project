class Play extends Phaser.Scene 
{
    init()
    {
        //player speed
        this.VEL = 200;
    }


    preload()
    {
        //load tilemap, player, and tileset assets
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
    
    create() 
    {
        //movement directions
        this.cursors = this.input.keyboard.addKeys
        ({
            'up': Phaser.Input.Keyboard.KeyCodes.W,
            'down': Phaser.Input.Keyboard.KeyCodes.S,
            'left': Phaser.Input.Keyboard.KeyCodes.A,
            'right': Phaser.Input.Keyboard.KeyCodes.D
        });

        //add map to scene
        const map = this.make.tilemap({ key: 'gameMap'});

        //add tilesets to be used in layers
        const tileset1 = map.addTilesetImage('farming_fishing', 'tileset1');
        const tileset2 = map.addTilesetImage('fence_alt', 'tileset2');
        const tileset5 = map.addTilesetImage('plowed_soil', 'tileset5');
        const tileset7 = map.addTilesetImage('reed', 'tileset7');
        const tileset8 = map.addTilesetImage('sand', 'tileset8');
        const tileset9 = map.addTilesetImage('sandwater', 'tileset9');
        const tileset11 = map.addTilesetImage('tileset_preview', 'tileset11');

        //define each tile layer and handle collision
        const tileLayer1 = map.createLayer('Tile Layer 1', [tileset11, tileset5], 0, 0);
        const tileLayer2 = map.createLayer('Tile Layer 2', [tileset8], 0, 0);
        const tileLayer4 = map.createLayer('Tile Layer 4', [tileset7, tileset11], 0, 0);

        const collisionLayer1 = map.createLayer('Collision Layer 1', [tileset1, tileset11, tileset2, tileset9], 0, 0);
        const collisionLayer2 = map.createLayer('Collision Layer 2', [tileset1, tileset11, tileset2, tileset7], 0, 0);

        collisionLayer1.setCollisionByExclusion([-1]);
        collisionLayer2.setCollisionByExclusion([-1]);

        //add player to scene and allow player collision and player camera movement
        this.player = this.physics.add.sprite(1200, 1600, 'player', 0);
        this.player.body.setCollideWorldBounds(true);
        this.player.setScale(1.5);

        this.cameras.main.startFollow(this.player, true);

        this.physics.add.collider(this.player, collisionLayer1);
        this.physics.add.collider(this.player, collisionLayer2);
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);


        

    }

    update()
    {
        //update the direction that the player is moving in on screen
        this.direction = new Phaser.Math.Vector2(0);

        if (this.cursors.left.isDown)
        {
            this.direction.x = -1;
        }

        else if (this.cursors.right.isDown)
        {
            this.direction.x = 1;
        }

        if (this.cursors.up.isDown)
        {
            this.direction.y = -1;
        }
    
        else if (this.cursors.down.isDown)
        {
            this.direction.y = 1;
        }

        this.direction.normalize();
        this.player.setVelocity(this.VEL * this.direction.x, this.VEL * this.direction.y);
    }
}
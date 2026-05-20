import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Progress Bar for Loading
        const { width, height } = this.scale;
        const progress = this.add.graphics();
        this.load.on('progress', (value: number) => {
            progress.clear();
            progress.fillStyle(0xf4d03f, 1);
            progress.fillRect(width / 4, height / 2, (width / 2) * value, 20);
        });
        
        this.add.text(width / 2, height / 2 - 30, 'CALIBRATING REALM FEED...', { 
            fontFamily: 'Space Grotesk',
            fontSize: '14px', 
            color: '#ffeebb' 
        }).setOrigin(0.5);
        
        // Load World Map
        this.load.image('world_map', 'assets/world_map.png');
        
        // Load Character Sprites
        this.load.image('hero', 'assets/main_character.png');
        this.load.image('party1', 'assets/party_member_1.png');
        this.load.image('party2', 'assets/party_member_2.png');
        this.load.image('party3', 'assets/party_member_3.png');
        this.load.image('party4', 'assets/party_member_4.png');
        
        // Load UI Elements
        this.load.image('ui-heart', 'assets/ui/Icon_Heart.png');
        this.load.image('ui-gold', 'assets/ui/Icon_Gold.png');
        this.load.image('ui-ap', 'assets/ui/Icon_Energy_Yellow.png');
        this.load.image('ui-map', 'assets/ui/Icon_Gps.png');
        this.load.image('ui-sword', 'assets/ui/Icon_MenuIcon03_Shield_n.Png'); // Using shield for now as sword icon wasn't explicitly named sword in list but there was MenuIcon03_Shield
        
        // Find a sword icon in the list... actually there is Icon_PictoIcon_Lock_l and Icon_StatsIcon_Fist
        // I'll use Icon_StatsIcon_Fist for combat if needed.
        this.load.image('ui-combat', 'assets/ui/Icon_StatsIcon_Fist.Png');

        // Load Weapons
        this.load.image('weapon-bat', 'assets/weapons/bat_1.png');
        this.load.image('weapon-club', 'assets/weapons/club_3.png');
        this.load.image('weapon-gear', 'assets/weapons/gear_right_28.png');
    }

    create() {
        this.scene.start('WorldScene');
    }
}

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.add.text(10, 10, 'Loading Heroes...', { color: '#ffffff' });
        
        // Load Character Sprites
        this.load.image('hero', 'src/assets/main_character.png');
        this.load.image('party1', 'src/assets/party_member_1.png');
        this.load.image('party2', 'src/assets/party_member_2.png');
        this.load.image('party3', 'src/assets/party_member_3.png');
        this.load.image('party4', 'src/assets/party_member_4.png');
    }

    create() {
        const { width, height } = this.scale;

        // Add a simple background or floor line
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x444444);
        graphics.lineBetween(0, height - 100, width, height - 100);

        // Display Characters in formation
        // Main Hero in front
        this.add.image(width / 2, height / 2, 'hero').setScale(0.5).setOrigin(0.5);
        this.add.text(width / 2, height / 2 + 60, 'Leader', { fontSize: '14px', color: '#00ff00' }).setOrigin(0.5);

        // Party members in a semi-circle behind the hero
        const positions = [
            { x: width / 2 - 150, y: height / 2 + 50, key: 'party1', label: 'Member 1' },
            { x: width / 2 - 80, y: height / 2 + 80, key: 'party2', label: 'Member 2' },
            { x: width / 2 + 80, y: height / 2 + 80, key: 'party3', label: 'Member 3' },
            { x: width / 2 + 150, y: height / 2 + 50, key: 'party4', label: 'Member 4' }
        ];

        positions.forEach(pos => {
            this.add.image(pos.x, pos.y, pos.key).setScale(0.4).setOrigin(0.5);
            this.add.text(pos.x, pos.y + 50, pos.label, { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5);
        });

        this.add.text(width / 2, 50, 'FinJourney: The Quest Begins', { 
            fontSize: '32px', 
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width / 2, height - 50, 'Waiting for Action Points from Finance App...', { 
            fontSize: '18px', 
            color: '#aaaaaa' 
        }).setOrigin(0.5);

        console.log('RPG Party Rendered');
    }
}

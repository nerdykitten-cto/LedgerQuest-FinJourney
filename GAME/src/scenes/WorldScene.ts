import Phaser from 'phaser';

interface GameSyncData {
    ap: number;
    level: number;
    gold: number;
    campaign: {
        currentLocation: string;
        progressPercentage: number;
        worldState: string;
        activeEnemy?: any;
    };
    party: any[];
}

export class WorldScene extends Phaser.Scene {
    private apText!: Phaser.GameObjects.Text;
    private goldText!: Phaser.GameObjects.Text;
    private locationText!: Phaser.GameObjects.Text;
    private apValue: number = 0;
    private goldValue: number = 0;
    private currentLocation: string = 'Starting Village';
    private dialogueBox!: Phaser.GameObjects.Container;
    private dialogueText!: Phaser.GameObjects.Text;
    private partyData: any[] = [];
    
    private locations = [
        { name: 'Starting Village', x: 180, y: 480, description: 'A humble beginning for a grand ledger.' },
        { name: 'Copper Town', x: 580, y: 420, description: 'The hub of base metal trade.' },
        { name: 'Silver City', x: 720, y: 220, description: 'Glistening spires of high-yield capital.' },
        { name: 'Iron Citadel', x: 400, y: 120, description: 'The fortress of impenetrable savings.' }
    ];

    constructor() {
        super('WorldScene');
    }

    create() {
        const { width, height } = this.scale;
        const map = this.add.image(0, 0, 'world_map').setOrigin(0);
        map.setDisplaySize(width, height);
        map.setAlpha(0.7);
        this.add.rectangle(0, 0, width, height, 0x060d20, 0.3).setOrigin(0);

        const graphics = this.add.graphics();
        graphics.lineStyle(3, 0xf4d03f, 0.4);
        graphics.beginPath();
        graphics.moveTo(this.locations[0].x, this.locations[0].y);
        for (let i = 1; i < this.locations.length; i++) {
            graphics.lineTo(this.locations[i].x, this.locations[i].y);
        }
        graphics.strokePath();

        this.locations.forEach(loc => {
            const glow = this.add.circle(loc.x, loc.y, 25, 0xf4d03f, 0.15);
            this.tweens.add({ targets: glow, radius: 35, alpha: 0.05, duration: 1500, yoyo: true, repeat: -1 });

            const pin = this.add.image(loc.x, loc.y, 'ui-map').setScale(0.5).setInteractive({ useHandCursor: true });
            const nameTag = this.add.text(loc.x, loc.y + 35, loc.name.toUpperCase(), { 
                fontFamily: 'Space Grotesk', fontSize: '12px', color: '#ffeebb', backgroundColor: '#171f33ee',
                padding: { x: 6, y: 3 }, stroke: '#4c4634', strokeThickness: 1
            }).setOrigin(0.5).setAlpha(0.8);
            
            pin.on('pointerover', () => { pin.setScale(0.7); nameTag.setAlpha(1).setScale(1.1).setColor('#f4d03f'); this.cameras.main.shake(100, 0.001); });
            pin.on('pointerout', () => { pin.setScale(0.5); nameTag.setAlpha(0.8).setScale(1).setColor('#ffeebb'); });
            
            let lastClickTime = 0;
            pin.on('pointerdown', () => {
                const clickDelay = this.time.now - lastClickTime;
                lastClickTime = this.time.now;
                if (clickDelay < 350) { this.enterTown(loc.name); } else { this.handleTravel(loc.name); }
            });
        });

        const header = this.add.container(0, 0);
        const headerBg = this.add.rectangle(0, 0, width, 70, 0x0b1326, 0.9).setOrigin(0);
        headerBg.setStrokeStyle(2, 0x4c4634);
        
        const apIcon = this.add.image(40, 35, 'ui-ap').setScale(0.4);
        this.apText = this.add.text(70, 35, 'AP: 0', { fontFamily: 'Bricolage Grotesque', fontSize: '22px', color: '#f4d03f', fontStyle: '800' }).setOrigin(0, 0.5);

        const goldIcon = this.add.image(220, 35, 'ui-gold').setScale(0.4);
        this.goldText = this.add.text(250, 35, '0 G', { fontFamily: 'Bricolage Grotesque', fontSize: '22px', color: '#ffeebb', fontStyle: '800' }).setOrigin(0, 0.5);

        this.locationText = this.add.text(width / 2, 35, '📍 STARTING VILLAGE', { fontFamily: 'Space Grotesk', fontSize: '18px', color: '#dbe2fd' }).setOrigin(0.5);
        header.add([headerBg, apIcon, this.apText, goldIcon, this.goldText, this.locationText]);

        const hero = this.add.image(width / 2, height - 80, 'hero').setScale(0.6);
        this.tweens.add({ targets: hero, y: height - 85, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        this.createDialogueBox();
        this.game.events.on('player-sync', (data: GameSyncData) => {
            this.apValue = data.ap; this.goldValue = data.gold; this.partyData = data.party;
            this.apText.setText(`AP: ${data.ap}`); this.goldText.setText(`${data.gold} G`);
            this.locationText.setText(`📍 ${data.campaign.currentLocation.toUpperCase()}`);
            if (data.campaign.worldState === 'battle' && data.campaign.activeEnemy) {
                this.scene.start('BattleScene', { enemy: data.campaign.activeEnemy, party: data.party });
            }
        });
        this.showDialogue('SIGNAL STABLE. COMMENCING REALM OBSERVATION...');
    }

    enterTown(name: string) {
        if (name !== this.currentLocation) { this.showDialogue("DESTINATION OUT OF RANGE. TRAVEL REQUIRED."); return; }
        this.showDialogue(`INITIATING ENTRY PROTOCOL: ${name}...`);
        this.cameras.main.fadeOut(1000, 6, 13, 32);
        this.time.delayedCall(1000, () => {
            this.scene.start('TownScene', { name, ap: this.apValue, gold: this.goldValue, party: this.partyData });
        });
    }

    createDialogueBox() {
        const { width, height } = this.scale;
        this.dialogueBox = this.add.container(width / 2, height - 100).setVisible(false).setDepth(2000);
        const bg = this.add.rectangle(0, 0, width * 0.8, 80, 0x171f33, 0.95).setOrigin(0.5).setStrokeStyle(2, 0xf4d03f, 0.5);
        this.dialogueText = this.add.text(0, 0, '', { fontFamily: 'Be Vietnam Pro', fontSize: '16px', color: '#dbe2fd', align: 'center', wordWrap: { width: width * 0.7 } }).setOrigin(0.5);
        this.dialogueBox.add([bg, this.dialogueText]);
        bg.setInteractive().on('pointerdown', () => this.dialogueBox.setVisible(false));
    }

    showDialogue(msg: string) {
        this.dialogueText.setText(msg); this.dialogueBox.setVisible(true);
        this.time.delayedCall(4000, () => { if (this.dialogueText.text === msg) this.dialogueBox.setVisible(false); });
    }

    handleTravel(destination: string) {
        if (destination === this.currentLocation) return;
        const cost = 20; 
        if (this.apValue >= cost) {
            this.currentLocation = destination;
            window.parent.postMessage({ type: 'TRAVEL_ACTION', data: { destination, cost } }, '*');
            this.cameras.main.flash(500, 244, 208, 63);
            this.showDialogue(`REALLOCATING AP... TRAVELING TO ${destination.toUpperCase()}.`);
        } else {
            this.cameras.main.shake(200, 0.005);
            this.showDialogue('INSUFFICIENT ACTION POINTS FOR TRAVEL.');
        }
    }
}

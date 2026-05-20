import Phaser from 'phaser';

export class TownScene extends Phaser.Scene {
    private townName: string = '';
    private apValue: number = 0;
    private goldValue: number = 0;
    
    private dialogueBox!: Phaser.GameObjects.Container;
    private dialogueText!: Phaser.GameObjects.Text;

    constructor() {
        super('TownScene');
    }

    init(data: { name: string, ap: number, gold: number }) {
        this.townName = data.name;
        this.apValue = data.ap;
        this.goldValue = data.gold;
    }

    create() {
        const { width, height } = this.scale;

        // Visual Layout: Dark Archive Town
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x171f33, 0x171f33, 0x060d20, 0x060d20, 1);
        bg.fillRect(0, 0, width, height);

        // Cobblestone ground
        const ground = this.add.graphics();
        ground.fillStyle(0x0b1326, 1);
        ground.fillRect(0, height * 0.7, width, height * 0.3);
        
        this.add.rectangle(0, height * 0.7, width, 2, 0x4c4634).setOrigin(0);

        this.add.text(width / 2, 40, `${this.townName.toUpperCase()} ENCLAVE`, { 
            fontFamily: 'Bricolage Grotesque',
            fontSize: '32px', 
            color: '#ffeebb', 
            fontStyle: '800'
        }).setOrigin(0.5);

        // NPCs based on Town
        if (this.townName === 'Starting Village') {
            this.createNPC(width * 0.25, height * 0.65, '🧙‍♂️', 'Chronicler Daniel', () => {
                this.handleTalk('Chronicler Daniel', "WELCOME, SCRIBE. TO CLEAR THE FOG OF DEBT, ONE MUST FIRST DOCUMENT THE FLOW. LOG YOUR EXPENSES TO EARN THE ACTION POINTS NEEDED TO PROCEED.");
            });
        }

        // Shop: Equipment & Items
        this.createNPC(width * 0.75, height * 0.65, '🛒', 'Ledger Merchant', () => {
            this.showShop();
        });

        // Outskirts: Battle Trigger
        this.createNPC(width * 0.5, height * 0.5, '🌲', 'TO THE WILD LOGS', () => {
            this.showDialogue("HEADING TO THE UNCHARTED TERRITORIES? ENSURE YOUR HP RESERVE IS OPTIMAL.");
            this.time.delayedCall(2000, () => {
                window.parent.postMessage({ type: 'BATTLE_ACTION' }, '*');
            });
        });

        // Header UI
        const headerBg = this.add.rectangle(0, 0, width, 60, 0x0b1326, 0.8).setOrigin(0);
        headerBg.setStrokeStyle(1, 0x4c4634);
        
        this.add.image(30, 30, 'ui-ap').setScale(0.3);
        this.add.text(50, 30, `AP: ${this.apValue}`, { fontFamily: 'Space Grotesk', fontSize: '18px', color: '#f4d03f' }).setOrigin(0, 0.5);
        
        this.add.image(160, 30, 'ui-gold').setScale(0.3);
        this.add.text(180, 30, `${this.goldValue} G`, { fontFamily: 'Space Grotesk', fontSize: '18px', color: '#ffeebb' }).setOrigin(0, 0.5);

        // Back to Map Button
        const backBtn = this.add.text(width - 100, 30, '[ EXIT ]', { 
            fontFamily: 'Space Grotesk',
            fontSize: '16px', 
            color: '#ffb4aa', 
            fontStyle: 'bold' 
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        backBtn.on('pointerdown', () => {
            this.cameras.main.fadeOut(500, 6, 13, 32);
            this.time.delayedCall(500, () => this.scene.start('WorldScene'));
        });

        this.createDialogueBox();
        this.cameras.main.fadeIn(500, 6, 13, 32);
    }

    createNPC(x: number, y: number, emoji: string, label: string, callback: () => void) {
        const container = this.add.container(x, y);
        const sprite = this.add.text(0, 0, emoji, { fontSize: '64px' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const nameTag = this.add.text(0, 50, label.toUpperCase(), { 
            fontFamily: 'Space Grotesk',
            fontSize: '12px', 
            color: '#ffeebb', 
            backgroundColor: '#171f33',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5);
        
        nameTag.setStroke('#4c4634', 1);
        
        container.add([sprite, nameTag]);
        sprite.on('pointerdown', callback);
        sprite.on('pointerover', () => { sprite.setScale(1.1); nameTag.setColor('#f4d03f'); });
        sprite.on('pointerout', () => { sprite.setScale(1); nameTag.setColor('#ffeebb'); });
        
        this.tweens.add({
            targets: container,
            y: y - 15,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createDialogueBox() {
        const { width, height } = this.scale;
        this.dialogueBox = this.add.container(width / 2, height - 100).setVisible(false).setDepth(2000);
        const bg = this.add.rectangle(0, 0, width * 0.8, 80, 0x171f33, 0.95).setOrigin(0.5).setStrokeStyle(2, 0xf4d03f);
        this.dialogueText = this.add.text(0, 0, '', { 
            fontFamily: 'Be Vietnam Pro',
            fontSize: '16px', color: '#dbe2fd', align: 'center', wordWrap: { width: width * 0.7 } 
        }).setOrigin(0.5);
        this.dialogueBox.add([bg, this.dialogueText]);
        bg.setInteractive().on('pointerdown', () => this.dialogueBox.setVisible(false));
    }

    showDialogue(msg: string) {
        this.dialogueText.setText(msg);
        this.dialogueBox.setVisible(true);
    }

    handleTalk(npcName: string, msg: string) {
        this.showDialogue(`${npcName.toUpperCase()}: ${msg}`);
        window.parent.postMessage({ type: 'TALK_ACTION', data: { npcName } }, '*');
    }

    showShop() {
        const { width, height } = this.scale;
        const shopOverlay = this.add.container(0, 0).setDepth(3000);
        const bg = this.add.rectangle(0, 0, width, height, 0x060d20, 0.9).setOrigin(0).setInteractive();
        const panel = this.add.rectangle(width / 2, height / 2, 500, 400, 0x0b1326).setStrokeStyle(4, 0x4c4634);
        
        const title = this.add.text(width / 2, height / 2 - 160, 'LEDGER MERCHANT', { fontFamily: 'Bricolage Grotesque', fontSize: '28px', color: '#f4d03f', fontStyle: '800' }).setOrigin(0.5);
        
        const items = [
            { name: 'Bat of Debt', cost: 200, sprite: 'weapon-bat' },
            { name: 'Gear Slicer', cost: 500, sprite: 'weapon-gear' }
        ];

        items.forEach((item, i) => {
            const y = height / 2 - 60 + (i * 100);
            const card = this.add.rectangle(width / 2, y, 440, 80, 0x171f33).setStrokeStyle(2, 0x4c4634).setInteractive({ useHandCursor: true });
            this.add.image(width / 2 - 180, y, item.sprite).setScale(0.4);
            this.add.text(width / 2 - 120, y, item.name, { fontFamily: 'Space Grotesk', fontSize: '18px', color: '#ffeebb' }).setOrigin(0, 0.5);
            this.add.text(width / 2 + 100, y, `${item.cost} G`, { fontFamily: 'Space Grotesk', fontSize: '18px', color: '#f4d03f', fontStyle: 'bold' }).setOrigin(0, 0.5);
            
            card.on('pointerdown', () => {
                if (this.goldValue >= item.cost) {
                    window.parent.postMessage({ type: 'SHOP_PURCHASE', data: { item, cost: item.cost } }, '*');
                    this.showDialogue(`PURCHASED ${item.name}!`);
                    shopOverlay.destroy();
                } else {
                    this.cameras.main.shake(200, 0.005);
                }
            });
        });

        const closeBtn = this.add.text(width / 2, height / 2 + 160, '[ CLOSE SHOP ]', { fontFamily: 'Space Grotesk', fontSize: '18px', color: '#ffb4aa', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => shopOverlay.destroy());

        shopOverlay.add([bg, panel, title, closeBtn]);
    }
}

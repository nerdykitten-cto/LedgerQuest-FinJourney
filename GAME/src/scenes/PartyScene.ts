import Phaser from 'phaser';

interface EquipmentItem {
    id: string;
    name: string;
    type: 'weapon' | 'armor';
    sprite: string;
}

export class PartyScene extends Phaser.Scene {
    private party: any[] = [];
    private selectedItem: Phaser.GameObjects.Image | null = null;
    private inventory: EquipmentItem[] = [
        { id: 'w1', name: 'Bat of Debt', type: 'weapon', sprite: 'weapon-bat' },
        { id: 'a1', name: 'Savings Shield', type: 'armor', sprite: 'ui-sword' },
        { id: 'w2', name: 'Gear Slicer', type: 'weapon', sprite: 'weapon-gear' },
        { id: 'w3', name: 'Budget Club', type: 'weapon', sprite: 'weapon-club' }
    ];

    constructor() {
        super('PartyScene');
    }

    init(data: { party: any[] }) {
        this.party = data.party || [];
    }

    create() {
        const { width, height } = this.scale;
        this.add.rectangle(0, 0, width, height, 0x060d20, 0.9).setOrigin(0).setInteractive();
        
        const panel = this.add.graphics();
        panel.fillStyle(0x0b1326, 1);
        panel.fillRoundedRect(40, 80, width - 80, height - 160, 20);
        panel.lineStyle(3, 0x4c4634, 1);
        panel.strokeRoundedRect(40, 80, width - 80, height - 160, 20);

        this.add.text(width / 2, 120, 'WAR ROOM: PARTY LOG', { 
            fontFamily: 'Bricolage Grotesque', fontSize: '32px', color: '#f4d03f', fontStyle: '800'
        }).setOrigin(0.5);

        const memberSpacing = (width - 80) / (this.party.length + 1);
        this.party.forEach((member, i) => {
            const x = 40 + (memberSpacing * (i + 1));
            const y = 240;
            const container = this.add.container(x, y);
            container.add(this.add.circle(0, -30, 45, 0x171f33).setStrokeStyle(2, 0xf4d03f, 0.3));
            container.add(this.add.image(0, -30, i === 0 ? 'hero' : `party${i}`).setScale(0.5));
            container.add(this.add.text(0, 35, member.name.toUpperCase(), { fontFamily: 'Space Grotesk', fontSize: '14px', color: '#ffeebb', fontStyle: 'bold' }).setOrigin(0.5));
            
            const wpnSlot = this.add.rectangle(-35, 100, 45, 45, 0x171f33, 1).setStrokeStyle(2, 0x4c4634).setInteractive().setName(`wpn-${member.id}`);
            if (wpnSlot.input) wpnSlot.input.dropZone = true;
            container.add(wpnSlot);
            container.add(this.add.text(-35, 130, 'WPN', { fontFamily: 'Space Grotesk', fontSize: '8px', color: '#4c4634' }).setOrigin(0.5));

            const armSlot = this.add.rectangle(35, 100, 45, 45, 0x171f33, 1).setStrokeStyle(2, 0x4c4634).setInteractive().setName(`arm-${member.id}`);
            if (armSlot.input) armSlot.input.dropZone = true;
            container.add(armSlot);
            container.add(this.add.text(35, 130, 'ARM', { fontFamily: 'Space Grotesk', fontSize: '8px', color: '#4c4634' }).setOrigin(0.5));

            if (member.equipment?.weapon) {
                const item = this.inventory.find(inv => inv.id === member.equipment.weapon);
                if (item) this.add.image(x - 35, y + 100, item.sprite).setScale(0.3);
            }
        });

        this.add.text(width / 2, height - 180, 'SCRIBED EQUIPMENT', { fontFamily: 'Space Grotesk', fontSize: '18px', color: '#ffeebb', letterSpacing: 2 }).setOrigin(0.5);
        this.inventory.forEach((item, i) => {
            const x = 120 + (i * 140);
            const y = height - 130;
            this.add.rectangle(x, y, 100, 80, 0x171f33, 0.8).setStrokeStyle(1, 0x4c4634);
            const sprite = this.add.image(x, y - 10, item.sprite).setScale(0.4).setInteractive({ draggable: true, useHandCursor: true }).setData('item', item);
            this.add.text(x, y + 25, item.name, { fontFamily: 'Be Vietnam Pro', fontSize: '10px', color: '#cfc6ae' }).setOrigin(0.5);
            sprite.on('dragstart', () => { sprite.setDepth(1000).setAlpha(0.7).setScale(0.5); this.clearSelection(); });
            sprite.on('drag', (_p: any, dx: number, dy: number) => { sprite.x = dx; sprite.y = dy; });
            sprite.on('dragend', (_p: any, dropped: boolean) => { sprite.setAlpha(1).setScale(0.4); if (!dropped) { sprite.x = x; sprite.y = y - 10; } });
            sprite.on('pointerdown', () => this.selectItem(sprite));
        });

        const closeBtn = this.add.text(width / 2, height - 40, '[ RETURN TO REALM FEED ]', { fontFamily: 'Space Grotesk', fontSize: '16px', color: '#f4d03f', fontStyle: '800' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => { this.scene.stop(); this.scene.resume('WorldScene'); });

        this.input.on('drop', (_p: any, gameObject: any, dropZone: any) => {
            const item = gameObject.getData('item') as EquipmentItem;
            const isWpn = dropZone.name.startsWith('wpn-');
            const isArm = dropZone.name.startsWith('arm-');
            if ((item.type === 'weapon' && isWpn) || (item.type === 'armor' && isArm)) {
                this.assignEquipment(dropZone.name.split('-')[1], item);
            } else {
                this.cameras.main.shake(200, 0.005);
                gameObject.x = gameObject.input.dragStartX; gameObject.y = gameObject.input.dragStartY;
            }
        });
    }

    selectItem(gameObject: Phaser.GameObjects.Image) {
        this.clearSelection(); this.selectedItem = gameObject; gameObject.setTint(0xf4d03f);
        this.tweens.add({ targets: gameObject, angle: 5, duration: 100, yoyo: true, repeat: -1 });
    }

    clearSelection() {
        if (this.selectedItem) { this.selectedItem.clearTint(); this.selectedItem.setAngle(0); this.tweens.killTweensOf(this.selectedItem); this.selectedItem = null; }
    }

    assignEquipment(memberId: string, item: EquipmentItem) {
        window.parent.postMessage({ type: 'UPDATE_PARTY_MEMBER', data: { memberId, equipment: { [item.type]: item.id } } }, '*');
        this.cameras.main.flash(300, 244, 208, 63);
        this.time.delayedCall(400, () => this.scene.restart());
    }
}

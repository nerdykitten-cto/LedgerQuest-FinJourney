import Phaser from 'phaser';

interface Enemy {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
}

interface PartyMember {
    id: string;
    name: string;
    role: string;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    level: number;
}

export class BattleScene extends Phaser.Scene {
    private enemy!: Enemy;
    private party!: PartyMember[];
    
    private enemyHpText!: Phaser.GameObjects.Text;
    private battleLog!: Phaser.GameObjects.Text;
    private partyContainers: Phaser.GameObjects.Container[] = [];

    constructor() {
        super('BattleScene');
    }

    init(data: { enemy: Enemy, party: PartyMember[] }) {
        this.enemy = data.enemy;
        this.party = data.party;
    }

    create() {
        const { width, height } = this.scale;

        // Background - Dark Combat feel
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x060d20, 0x060d20, 0x1a0a1a, 0x1a0a1a, 1);
        bg.fillRect(0, 0, width, height);
        
        // Header
        this.add.text(width / 2, 40, 'CRITICAL INCURSION', { 
            fontFamily: 'Bricolage Grotesque',
            fontSize: '32px', 
            color: '#ffb4aa', 
            fontStyle: '800'
        }).setOrigin(0.5);
        
        // Enemy Area
        const enemySprite = this.add.image(width / 2, 140, 'ui-combat').setScale(0.8);
        this.tweens.add({
            targets: enemySprite,
            scale: 0.9,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        this.add.text(width / 2, 220, this.enemy.name.toUpperCase(), { 
            fontFamily: 'Space Grotesk',
            fontSize: '20px', 
            color: '#ffb4aa', 
            fontStyle: 'bold' 
        }).setOrigin(0.5);
        
        // Enemy HP Bar
        const enemyBarW = 250;
        this.add.rectangle(width / 2, 250, enemyBarW, 12, 0x171f33).setStrokeStyle(1, 0x4c4634);
        const enemyFill = this.add.rectangle(width / 2 - enemyBarW / 2, 250, enemyBarW, 12, 0x84231d).setOrigin(0, 0.5);
        this.enemyHpText = this.add.text(width / 2, 270, `EN_HEALTH: ${this.enemy.hp}%`, { 
            fontFamily: 'Space Grotesk',
            fontSize: '10px', 
            color: '#ff9a8e' 
        }).setOrigin(0.5);

        // Party Area
        const memberSpacing = width / (this.party.length + 1);
        this.party.forEach((member, i) => {
            const x = memberSpacing * (i + 1);
            const y = height * 0.7;
            
            const container = this.add.container(x, y);
            const sprite = this.add.image(0, -30, i === 0 ? 'hero' : `party${i}`).setScale(0.45);
            
            const name = this.add.text(0, 35, member.name, { 
                fontFamily: 'Space Grotesk',
                fontSize: '12px', 
                color: '#ffeebb' 
            }).setOrigin(0.5);
            
            // Member HP Bar
            this.add.rectangle(0, 55, 80, 6, 0x171f33).setStrokeStyle(1, 0x4c4634);
            const hpFill = this.add.rectangle(-40, 55, 80 * (member.hp / member.maxHp), 6, 0xf4d03f).setOrigin(0, 0.5);
            
            const attackBtn = this.add.container(0, 90);
            const btnBg = this.add.rectangle(0, 0, 90, 30, 0x171f33).setStrokeStyle(2, 0x4c4634).setInteractive({ useHandCursor: true });
            const btnText = this.add.text(0, 0, 'STRIKE', { 
                fontFamily: 'Bricolage Grotesque',
                fontSize: '12px', 
                color: '#ffeebb', 
                fontStyle: 'bold' 
            }).setOrigin(0.5);
            
            btnBg.on('pointerdown', () => this.handlePlayerAttack(member, i, enemyFill, hpFill));
            btnBg.on('pointerover', () => { btnBg.setFillStyle(0x222a3e); btnText.setColor('#f4d03f'); });
            btnBg.on('pointerout', () => { btnBg.setFillStyle(0x171f33); btnText.setColor('#ffeebb'); });
            
            attackBtn.add([btnBg, btnText]);
            container.add([sprite, name, hpFill, attackBtn]);
            this.partyContainers.push(container);
        });

        // Battle Log
        const logBox = this.add.container(width / 2, height - 60);
        const logBg = this.add.rectangle(0, 0, width * 0.8, 60, 0x0b1326, 0.9).setStrokeStyle(2, 0x4c4634);
        this.battleLog = this.add.text(0, 0, 'INITIALIZING COMBAT PROTOCOLS...', { 
            fontFamily: 'Space Grotesk',
            fontSize: '14px', color: '#f4d03f', align: 'center', wordWrap: { width: width * 0.7 } 
        }).setOrigin(0.5);
        logBox.add([logBg, this.battleLog]);
    }

    handlePlayerAttack(member: PartyMember, index: number, enemyBar: Phaser.GameObjects.Rectangle, _hpFill: Phaser.GameObjects.Rectangle) {
        const damage = Math.max(1, member.level * 10 + Math.floor(Math.random() * 10));
        this.enemy.hp = Math.max(0, this.enemy.hp - damage);
        
        const perc = (this.enemy.hp / this.enemy.maxHp);
        enemyBar.width = 250 * perc;
        this.enemyHpText.setText(`EN_HEALTH: ${Math.round(perc * 100)}%`);
        this.updateLog(`STRIKE SUCCESS: ${member.name} dealt ${damage} units.`);

        this.cameras.main.shake(100, 0.005);
        
        const sprite = this.partyContainers[index].list[0] as Phaser.GameObjects.Image;
        this.tweens.add({
            targets: sprite,
            y: sprite.y - 40,
            duration: 80,
            yoyo: true
        });

        if (this.enemy.hp <= 0) {
            this.handleVictory();
        } else {
            this.time.delayedCall(800, () => this.handleEnemyAttack());
        }
    }

    handleEnemyAttack() {
        const aliveMembers = this.party.filter(m => m.hp > 0);
        if (aliveMembers.length === 0) return;

        const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
        const targetIndex = this.party.indexOf(target);
        const damage = Math.max(1, this.enemy.attack + Math.floor(Math.random() * 5));
        
        target.hp = Math.max(0, target.hp - damage);
        this.updateLog(`COUNTER-STRIKE: ${this.enemy.name} hit ${target.name} for ${damage}.`);
        
        const hpFill = this.partyContainers[targetIndex].list[2] as Phaser.GameObjects.Rectangle;
        hpFill.width = 80 * (target.hp / target.maxHp);
        
        this.cameras.main.flash(100, 132, 35, 29);

        if (this.party.every(m => m.hp <= 0)) {
            this.handleDefeat();
        }
    }

    updateLog(msg: string) {
        this.battleLog.setText(msg.toUpperCase());
    }

    handleVictory() {
        this.updateLog('OBJECTIVE SECURED. VICTORY CONFIRMED.');
        this.time.delayedCall(1500, () => {
            window.parent.postMessage({ type: 'BATTLE_VICTORY' }, '*');
            this.scene.start('WorldScene');
        });
    }

    handleDefeat() {
        this.updateLog('CRITICAL FAILURE. ESCAPING COMBAT ZONE...');
        this.time.delayedCall(1500, () => {
            window.parent.postMessage({ type: 'BATTLE_DEFEAT' }, '*');
            this.scene.start('WorldScene');
        });
    }
}

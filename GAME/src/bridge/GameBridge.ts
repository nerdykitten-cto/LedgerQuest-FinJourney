export interface GameSyncData {
    ap: number;
    level: number;
    gold: number;
    campaign: any;
    party: any[];
}

export class GameBridge {
    private game: Phaser.Game;

    constructor(game: Phaser.Game) {
        this.game = game;
        this.setupListeners();
    }

    private setupListeners() {
        window.addEventListener('message', (event) => {
            // In production, we should check event.origin for security
            const { type, data } = event.data;

            switch (type) {
                case 'SYNC_PLAYER_DATA':
                    this.handleSync(data);
                    break;
                case 'START_QUEST':
                    this.handleStartQuest(data);
                    break;
                default:
                    console.log('Game received unknown message type:', type);
            }
        });

        // Notify parent that game is ready
        window.parent.postMessage({ type: 'GAME_READY' }, '*');
    }

    private handleSync(data: GameSyncData) {
        console.log('Game syncing data:', data);
        // Dispatch to Phaser scenes if needed
        this.game.events.emit('player-sync', data);
    }

    private handleStartQuest(data: any) {
        console.log('Game starting quest:', data);
        this.game.events.emit('quest-start', data);
    }
}

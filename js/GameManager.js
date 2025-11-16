export class GameManager {
    constructor() {
        this.currentLevel = 1;
        this.maxLevel = 10;
        this.score = 0;
        this.totalBlocksDestroyed = 0;

        // UI 요소
        this.levelDisplay = document.getElementById('level-display');
        this.scoreDisplay = document.getElementById('score-display');
        this.blocksDisplay = document.getElementById('blocks-display');

        // 모달
        this.levelCompleteModal = document.getElementById('level-complete');
        this.gameOverModal = document.getElementById('game-over');
        this.startScreen = document.getElementById('start-screen');

        this.listeners = {
            onStart: null,
            onNextLevel: null,
            onRestart: null,
            onBlockDestroyed: null
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.hideStartScreen();
            if (this.listeners.onStart) this.listeners.onStart();
        });

        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.hideModal(this.levelCompleteModal);
            this.nextLevel();
            if (this.listeners.onNextLevel) this.listeners.onNextLevel();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.hideModal(this.gameOverModal);
            this.restart();
            if (this.listeners.onRestart) this.listeners.onRestart();
        });
    }

    on(event, callback) {
        this.listeners[event] = callback;
    }

    hideStartScreen() {
        this.startScreen.classList.add('hidden');
    }

    showModal(modal) {
        modal.classList.remove('hidden');
    }

    hideModal(modal) {
        modal.classList.add('hidden');
    }

    updateUI(currentBlocks, totalBlocks) {
        this.levelDisplay.textContent = this.currentLevel;
        this.scoreDisplay.textContent = this.score;
        this.blocksDisplay.textContent = `${currentBlocks}/${totalBlocks}`;
    }

    addScore(points) {
        this.score += points;
        this.totalBlocksDestroyed++;
        this.scoreDisplay.textContent = this.score;
    }

    levelComplete() {
        // 레벨 완료 보너스
        const bonus = this.currentLevel * 100;
        this.score += bonus;

        document.getElementById('level-score').textContent = this.score;
        this.showModal(this.levelCompleteModal);
    }

    nextLevel() {
        this.currentLevel++;

        if (this.currentLevel > this.maxLevel) {
            this.gameComplete();
        }
    }

    gameComplete() {
        document.getElementById('final-score').textContent = this.score;
        this.showModal(this.gameOverModal);
    }

    restart() {
        this.currentLevel = 1;
        this.score = 0;
        this.totalBlocksDestroyed = 0;
        this.updateUI(0, 0);
    }

    isGameActive() {
        return !this.startScreen.classList.contains('hidden') === false &&
               this.levelCompleteModal.classList.contains('hidden') &&
               this.gameOverModal.classList.contains('hidden');
    }
}

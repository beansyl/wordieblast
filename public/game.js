class WordieBlast {
    constructor() {
        this.grid = Array(8).fill().map(() => Array(8).fill(null));
        this.score = 0;
        this.level = 1;
        this.currentMode = 'match3';
        this.selectedShape = null;
        this.colors = ['#FF69B4', '#FFD700', '#4169E1', '#32CD32', '#DA70D6'];
        this.letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        this.shapes = [];
        this.usedShapes = new Set(); // Track used shapes
        this.dictionary = ['CAT', 'DOG', 'RAT', 'BAT', 'HAT', 'MAT', 'SAT', 'FAT', 'PAT',
                          'RED', 'BED', 'LED', 'WED', 'FED',
                          'PEN', 'TEN', 'DEN', 'HEN', 'MEN',
                          'CAR', 'BAR', 'FAR', 'JAR', 'TAR',
                          'BOX', 'FOX', 'LOX',
                          'BUG', 'HUG', 'JUG', 'MUG', 'RUG', 'TUG'];

        this.sounds = {
            clear: new Audio('sounds/clear.mp3'),
            gameOver: new Audio('sounds/game-over.mp3'),
            invalidWord: new Audio('sounds/invalid-word.mp3'),
            levelUp: new Audio('sounds/level-up.mp3'),
            match: new Audio('sounds/match.mp3'),
            place: new Audio('sounds/place.mp3'),
            select: new Audio('sounds/select.mp3'),
            wordFound: new Audio('sounds/word-found.mp3')
        };

        Object.values(this.sounds).forEach(sound => {
            sound.load();
            sound.volume = 0.5;
        });
        
        this.initializeGame();
    }

    initializeGame() {
        this.createGrid();
        this.generateShapes();
        this.setupEventListeners();
        this.updateInstructions();
    }

    createGrid() {
        const gridElement = document.querySelector('.game-grid');
        gridElement.innerHTML = '';
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                gridElement.appendChild(cell);
            }
        }
    }

    generateShapes() {
        const patterns = [
            [[1, 1], [1, 1]], // 2x2 square
            [[1, 1, 1]], // horizontal line
            [[1], [1], [1]], // vertical line
        ];

        this.shapes = [];
        for (let i = 1; i <= 3; i++) {
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            const letters = pattern.map(row => 
                row.map(() => this.letters[Math.floor(Math.random() * this.letters.length)])
            );
            const shape = { pattern, color, letters };
            this.shapes.push(shape);
            
            const container = document.getElementById(`shape${i}`);
            container.innerHTML = '';
            this.renderShape(pattern, color, letters, container);
        }
    }

    renderShape(pattern, color, letters, container) {
        const shapeGrid = document.createElement('div');
        shapeGrid.style.display = 'grid';
        shapeGrid.style.gridTemplateColumns = `repeat(${pattern[0].length}, 30px)`;
        shapeGrid.style.gap = '2px';
        shapeGrid.style.justifyContent = 'center';
        
        pattern.forEach((row, i) => {
            row.forEach((cell, j) => {
                const div = document.createElement('div');
                div.style.width = '30px';
                div.style.height = '30px';
                div.style.backgroundColor = cell ? color : 'transparent';
                div.style.borderRadius = '4px';
                
                if (cell && this.currentMode === 'word') {
                    div.textContent = letters[i][j];
                    div.style.color = 'white';
                    div.style.display = 'flex';
                    div.style.alignItems = 'center';
                    div.style.justifyContent = 'center';
                    div.style.fontWeight = 'bold';
                    div.style.fontSize = '16px';
                }
                
                shapeGrid.appendChild(div);
            });
        });
        
        container.appendChild(shapeGrid);
        container.dataset.pattern = JSON.stringify(pattern);
        container.dataset.color = color;
        container.dataset.letters = JSON.stringify(letters);
    }

    setupEventListeners() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.changeMode(btn.id.replace('Mode', ''));
            });
        });

        document.querySelectorAll('.shape-container').forEach(container => {
            container.addEventListener('click', () => this.selectShape(container));
        });

        document.querySelector('.game-grid').addEventListener('click', (e) => {
            if (e.target.classList.contains('grid-cell')) {
                this.handleCellClick(e.target);
            }
        });
    }

    selectShape(container) {
        if (!container.dataset.pattern || !container.dataset.color) return;
        
        document.querySelectorAll('.shape-container').forEach(c => {
            c.style.border = '2px solid #2f3042';
        });
        container.style.border = '2px solid #4169E1';
        this.selectedShape = {
            pattern: JSON.parse(container.dataset.pattern),
            color: container.dataset.color,
            letters: JSON.parse(container.dataset.letters)
        };
        this.playSound('select');
    }

    handleCellClick(cell) {
        if (!this.selectedShape) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (this.canPlaceShape(row, col)) {
            this.placeShape(row, col);
        }
    }

    canPlaceShape(row, col) {
        if (!this.selectedShape) return false;

        const pattern = this.selectedShape.pattern;
        for (let i = 0; i < pattern.length; i++) {
            for (let j = 0; j < pattern[0].length; j++) {
                if (pattern[i][j]) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 8 || newCol >= 8 || this.grid[newRow][newCol] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    placeShape(row, col) {
        const pattern = this.selectedShape.pattern;
        const letters = this.selectedShape.letters;
        
        for (let i = 0; i < pattern.length; i++) {
            for (let j = 0; j < pattern[0].length; j++) {
                if (pattern[i][j]) {
                    this.grid[row + i][col + j] = this.selectedShape.color;
                    const cell = document.querySelector(`.grid-cell[data-row="${row + i}"][data-col="${col + j}"]`);
                    if (cell) {
                        cell.style.backgroundColor = this.selectedShape.color;
                        if (this.currentMode === 'word') {
                            cell.textContent = letters[i][j];
                            cell.style.color = 'white';
                            cell.style.display = 'flex';
                            cell.style.alignItems = 'center';
                            cell.style.justifyContent = 'center';
                            cell.style.fontWeight = 'bold';
                            cell.style.fontSize = '16px';
                        }
                    }
                }
            }
        }
        
        this.playSound('place');
        this.usedShapes.add(this.selectedShape);
        this.selectedShape = null;
        
        // Only generate new shapes if all current shapes are used
        if (this.usedShapes.size === 3) {
            this.usedShapes.clear();
            this.generateShapes();
        }
        
        this.checkMatches();
    }

    // ... rest of the methods remain unchanged ...
    findMatches() {
        const matches = new Set();

        if (this.currentMode === 'match3') {
            // Check horizontal matches
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 6; j++) {
                    if (this.grid[i][j] && 
                        this.grid[i][j] === this.grid[i][j + 1] && 
                        this.grid[i][j] === this.grid[i][j + 2]) {
                        matches.add(`${i},${j}`);
                        matches.add(`${i},${j + 1}`);
                        matches.add(`${i},${j + 2}`);
                    }
                }
            }

            // Check vertical matches
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 8; j++) {
                    if (this.grid[i][j] && 
                        this.grid[i][j] === this.grid[i + 1][j] && 
                        this.grid[i][j] === this.grid[i + 2][j]) {
                        matches.add(`${i},${j}`);
                        matches.add(`${i + 1},${j}`);
                        matches.add(`${i + 2},${j}`);
                    }
                }
            }
        } 
        else if (this.currentMode === 'fill') {
            // Check filled rows
            for (let i = 0; i < 8; i++) {
                let rowFilled = true;
                for (let j = 0; j < 8; j++) {
                    if (this.grid[i][j] === null) {
                        rowFilled = false;
                        break;
                    }
                }
                if (rowFilled) {
                    for (let j = 0; j < 8; j++) {
                        matches.add(`${i},${j}`);
                    }
                }
            }

            // Check filled columns
            for (let j = 0; j < 8; j++) {
                let colFilled = true;
                for (let i = 0; i < 8; i++) {
                    if (this.grid[i][j] === null) {
                        colFilled = false;
                        break;
                    }
                }
                if (colFilled) {
                    for (let i = 0; i < 8; i++) {
                        matches.add(`${i},${j}`);
                    }
                }
            }
        }

        return Array.from(matches);
    }

    checkWordFormation() {
        const words = new Set();
        const visited = new Set();

        const getWord = (row, col, color, visited = new Set(), letters = []) => {
            const key = `${row},${col}`;
            if (row < 0 || row >= 8 || col < 0 || col >= 8 || 
                visited.has(key) || 
                this.grid[row][col] !== color) {
                return;
            }

            const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
            if (!cell || !cell.textContent) return;

            visited.add(key);
            letters.push({ letter: cell.textContent, pos: key });

            const word = letters.map(l => l.letter).join('');
            if (this.dictionary.includes(word)) {
                words.add(letters.map(l => l.pos));
            }

            // Check adjacent cells
            getWord(row - 1, col, color, visited, [...letters]); // up
            getWord(row + 1, col, color, visited, [...letters]); // down
            getWord(row, col - 1, color, visited, [...letters]); // left
            getWord(row, col + 1, color, visited, [...letters]); // right
        };

        // Search for words starting from each cell
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.grid[i][j]) {
                    getWord(i, j, this.grid[i][j]);
                }
            }
        }

        const matchesToClear = new Set();
        words.forEach(wordCells => {
            wordCells.forEach(cell => matchesToClear.add(cell));
        });

        if (matchesToClear.size > 0) {
            this.clearMatches(Array.from(matchesToClear));
            this.playSound('wordFound');
            return true;
        }

        return false;
    }

    clearMatches(matches) {
        matches.forEach(match => {
            const [row, col] = match.split(',').map(Number);
            this.grid[row][col] = null;
            const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.style.backgroundColor = '#1a1b26';
                cell.textContent = '';
            }
        });
        
        if (matches.length > 0) {
            this.playSound('match');
            this.updateScore(matches.length * 10);
            setTimeout(() => this.applyGravity(), 300);
        }
    }

    applyGravity() {
        for (let col = 0; col < 8; col++) {
            let emptyRow = 7;
            for (let row = 7; row >= 0; row--) {
                if (this.grid[row][col] !== null) {
                    if (emptyRow !== row) {
                        this.grid[emptyRow][col] = this.grid[row][col];
                        this.grid[row][col] = null;
                        
                        const targetCell = document.querySelector(`.grid-cell[data-row="${emptyRow}"][data-col="${col}"]`);
                        const sourceCell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
                        
                        if (targetCell && sourceCell) {
                            targetCell.style.backgroundColor = sourceCell.style.backgroundColor;
                            targetCell.textContent = sourceCell.textContent;
                            sourceCell.style.backgroundColor = '#1a1b26';
                            sourceCell.textContent = '';
                        }
                    }
                    emptyRow--;
                }
            }
        }
        setTimeout(() => this.checkMatches(), 300);
    }

    checkMatches() {
        if (this.currentMode === 'word') {
            if (this.checkWordFormation()) {
                setTimeout(() => this.applyGravity(), 300);
            } else {
                this.checkGameOver();
            }
        } else {
            const matches = this.findMatches();
            if (matches.length > 0) {
                this.clearMatches(matches);
            } else {
                this.checkGameOver();
            }
        }
    }

    updateScore(points) {
        const oldLevel = this.level;
        this.score += points;
        document.getElementById('score').textContent = this.score;
        
        const target = this.level * 100;
        if (this.score >= target) {
            this.level++;
            document.getElementById('level').textContent = this.level;
            document.getElementById('target').textContent = this.level * 100;
            this.playSound('levelUp');
            setTimeout(() => {
                alert(`Level ${oldLevel} completed! Moving to level ${this.level}`);
            }, 300);
        }
    }

    changeMode(mode) {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${mode}Mode`).classList.add('active');
        
        this.currentMode = mode;
        this.resetGame();
        this.updateInstructions();
    }

    updateInstructions() {
        const instructions = {
            match3: 'Match 3 or more blocks of the same color to score points.',
            fill: 'Fill a row or column with blocks to score points.',
            word: 'Form words by connecting blocks of the same color.'
        };
        document.getElementById('gameInstructions').textContent = instructions[this.currentMode];
    }

    resetGame() {
        this.grid = Array(8).fill().map(() => Array(8).fill(null));
        this.createGrid();
        this.generateShapes();
        this.selectedShape = null;
        this.usedShapes.clear();
        document.querySelectorAll('.shape-container').forEach(c => {
            c.style.border = '2px solid #2f3042';
        });
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => console.log('Audio play failed:', e));
        }
    }

    checkGameOver() {
        let canPlace = false;
        outer: for (let shape of this.shapes) {
            const tempSelected = this.selectedShape;
            this.selectedShape = shape;
            
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    if (this.canPlaceShape(i, j)) {
                        canPlace = true;
                        this.selectedShape = tempSelected;
                        break outer;
                    }
                }
            }
            this.selectedShape = tempSelected;
        }

        if (!canPlace) {
            this.playSound('gameOver');
            setTimeout(() => {
                alert('Game Over! No more possible moves.');
                this.resetGame();
            }, 500);
        }
    }
}

window.addEventListener('load', () => {
    new WordieBlast();
});
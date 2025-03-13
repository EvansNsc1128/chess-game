class ChessGame {
    constructor() {
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.isComputerThinking = false;
        this.isGameOver = false;
        this.board = this.createInitialBoard();
        this.initializeGame();
    }
    createInitialBoard() {
        return Array(8).fill(null).map(() => Array(8).fill(null));
    }
    initializeGame() {
        // 初始化棋子位置
        const pieces = [
            ['rook', 0],
            ['knight', 1],
            ['bishop', 2],
            ['queen', 3],
            ['king', 4],
            ['bishop', 5],
            ['knight', 6],
            ['rook', 7]
        ];
        // 放置主要棋子
        pieces.forEach(([type, col]) => {
            this.board[0][col] = { type, color: 'black' };
            this.board[7][col] = { type, color: 'white' };
        });
        // 放置兵
        for (let col = 0; col < 8; col++) {
            this.board[1][col] = { type: 'pawn', color: 'black' };
            this.board[6][col] = { type: 'pawn', color: 'white' };
        }
        this.renderBoard();
    }
    renderBoard() {
        const chessboard = document.getElementById('chessboard');
        chessboard.innerHTML = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                const piece = this.board[row][col];
                if (piece) {
                    square.innerHTML = this.getPieceSymbol(piece);
                }
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                chessboard.appendChild(square);
            }
        }
        this.updateStatus();
    }
    getPieceSymbol(piece) {
        // 统一使用白棋的图标样式，并为黑棋添加特殊类
        const symbols = {
            king: '♔',
            queen: '♕',
            rook: '♖',
            bishop: '♗',
            knight: '♘',
            pawn: '♙'
        };
        return `<span class="${piece.color}-piece">${symbols[piece.type]}</span>`;
    }
    handleSquareClick(row, col) {
        // 如果是电脑思考中或游戏结束，不允许操作
        if (this.isComputerThinking || this.isGameOver)
            return;
        // 只允许玩家操作白棋
        if (this.currentPlayer === 'black')
            return;
        const clickedSquare = { row, col };
        const piece = this.board[row][col];
        if (this.selectedPiece) {
            if (this.isValidMove(this.selectedPiece, clickedSquare)) {
                this.movePiece(this.selectedPiece, clickedSquare);
                this.selectedPiece = null;
                this.validMoves = [];
                // 玩家下完，切换到电脑
                this.currentPlayer = 'black';
                this.renderBoard();
                // 电脑走棋（稍微延迟，增加体验感）
                this.isComputerThinking = true;
                setTimeout(() => {
                    this.makeComputerMove();
                    this.isComputerThinking = false;
                }, 500);
            }
            else {
                this.selectedPiece = null;
                this.validMoves = [];
                this.renderBoard();
                this.highlightValidMoves();
            }
        }
        else if (piece && piece.color === 'white') {
            this.selectedPiece = clickedSquare;
            this.validMoves = this.getValidMoves(clickedSquare);
            this.renderBoard();
            this.highlightValidMoves();
        }
    }
    isValidMove(from, to) {
        return this.validMoves.some(move => move.row === to.row && move.col === to.col);
    }
    getValidMoves(pos) {
        const piece = this.board[pos.row][pos.col];
        if (!piece)
            return [];
        const moves = [];
        switch (piece.type) {
            case 'pawn':
                this.getPawnMoves(pos, moves);
                break;
            case 'rook':
                this.getRookMoves(pos, moves);
                break;
            case 'knight':
                this.getKnightMoves(pos, moves);
                break;
            case 'bishop':
                this.getBishopMoves(pos, moves);
                break;
            case 'queen':
                this.getQueenMoves(pos, moves);
                break;
            case 'king':
                this.getKingMoves(pos, moves);
                break;
        }
        return moves;
    }
    getPawnMoves(pos, moves) {
        var _a, _b;
        const direction = ((_a = this.board[pos.row][pos.col]) === null || _a === void 0 ? void 0 : _a.color) === 'white' ? -1 : 1;
        const startRow = ((_b = this.board[pos.row][pos.col]) === null || _b === void 0 ? void 0 : _b.color) === 'white' ? 6 : 1;
        // 前进一步
        if (this.isValidPosition(pos.row + direction, pos.col) &&
            !this.board[pos.row + direction][pos.col]) {
            moves.push({ row: pos.row + direction, col: pos.col });
            // 初始位置可以前进两步
            if (pos.row === startRow && !this.board[pos.row + 2 * direction][pos.col]) {
                moves.push({ row: pos.row + 2 * direction, col: pos.col });
            }
        }
        // 吃子移动
        [-1, 1].forEach(offset => {
            var _a;
            const newCol = pos.col + offset;
            if (this.isValidPosition(pos.row + direction, newCol)) {
                const targetPiece = this.board[pos.row + direction][newCol];
                if (targetPiece && targetPiece.color !== ((_a = this.board[pos.row][pos.col]) === null || _a === void 0 ? void 0 : _a.color)) {
                    moves.push({ row: pos.row + direction, col: newCol });
                }
            }
        });
    }
    getRookMoves(pos, moves) {
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        this.getSlidingMoves(pos, moves, directions);
    }
    getKnightMoves(pos, moves) {
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        offsets.forEach(([rowOffset, colOffset]) => {
            const newRow = pos.row + rowOffset;
            const newCol = pos.col + colOffset;
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                const currentPiece = this.board[pos.row][pos.col];
                if (!targetPiece || (targetPiece.color !== (currentPiece === null || currentPiece === void 0 ? void 0 : currentPiece.color))) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
    }
    getBishopMoves(pos, moves) {
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        this.getSlidingMoves(pos, moves, directions);
    }
    getQueenMoves(pos, moves) {
        this.getRookMoves(pos, moves);
        this.getBishopMoves(pos, moves);
    }
    getKingMoves(pos, moves) {
        const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        offsets.forEach(([rowOffset, colOffset]) => {
            const newRow = pos.row + rowOffset;
            const newCol = pos.col + colOffset;
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                const currentPiece = this.board[pos.row][pos.col];
                if (!targetPiece || (targetPiece.color !== (currentPiece === null || currentPiece === void 0 ? void 0 : currentPiece.color))) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
    }
    getSlidingMoves(pos, moves, directions) {
        const currentPiece = this.board[pos.row][pos.col];
        if (!currentPiece)
            return;
        directions.forEach(([rowDir, colDir]) => {
            let newRow = pos.row + rowDir;
            let newCol = pos.col + colDir;
            while (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                }
                else {
                    if (targetPiece.color !== currentPiece.color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                newRow += rowDir;
                newCol += colDir;
            }
        });
    }
    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    movePiece(from, to) {
        const piece = this.board[from.row][from.col];
        if (!piece)
            return;
        this.board[to.row][to.col] = piece;
        this.board[from.row][from.col] = null;
        if (piece.type === 'pawn') {
            piece.hasMoved = true;
        }
    }
    highlightValidMoves() {
        if (!this.selectedPiece)
            return;
        const squares = document.querySelectorAll('.square');
        squares.forEach((square, index) => {
            const row = Math.floor(index / 8);
            const col = index % 8;
            if (row === this.selectedPiece.row && col === this.selectedPiece.col) {
                square.classList.add('selected');
            }
            if (this.validMoves.some(move => move.row === row && move.col === col)) {
                square.classList.add('valid-move');
            }
        });
    }
    updateStatus() {
        const status = document.getElementById('status');
        if (this.isComputerThinking) {
            status.textContent = '电脑正在思考...';
        }
        else {
            status.textContent = `轮到${this.currentPlayer === 'white' ? '您(白方)' : '电脑(黑方)'}走棋`;
        }
    }
    makeComputerMove() {
        // 寻找所有可移动的黑棋
        const allPossibleMoves = [];
        // 收集所有黑棋的可能移动
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === 'black') {
                    const from = { row, col };
                    const validMoves = this.getValidMoves(from);
                    validMoves.forEach(to => {
                        allPossibleMoves.push({ from, to });
                    });
                }
            }
        }
        if (allPossibleMoves.length === 0) {
            // 没有可走的棋，游戏结束
            this.isGameOver = true;
            const status = document.getElementById('status');
            status.textContent = '游戏结束，白方获胜！';
            return;
        }
        // 为AI设置一点简单的策略
        // 1. 优先考虑吃子
        const captureMoves = allPossibleMoves.filter(move => this.board[move.to.row][move.to.col] !== null);
        let selectedMove;
        if (captureMoves.length > 0) {
            // 随机选择一个吃子行动
            selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
        }
        else {
            // 否则随机选择一个行动
            selectedMove = allPossibleMoves[Math.floor(Math.random() * allPossibleMoves.length)];
        }
        // 移动棋子
        this.movePiece(selectedMove.from, selectedMove.to);
        // 切换回玩家的回合
        this.currentPlayer = 'white';
        this.renderBoard();
        // 检查玩家是否还有有效走法
        let playerHasValidMoves = false;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === 'white') {
                    const moves = this.getValidMoves({ row, col });
                    if (moves.length > 0) {
                        playerHasValidMoves = true;
                        break;
                    }
                }
            }
            if (playerHasValidMoves)
                break;
        }
        if (!playerHasValidMoves) {
            this.isGameOver = true;
            const status = document.getElementById('status');
            status.textContent = '游戏结束，黑方获胜！';
        }
    }
    reset() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.isComputerThinking = false;
        this.isGameOver = false;
        this.initializeGame();
    }
}
// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    var _a;
    const game = new ChessGame();
    (_a = document.getElementById('reset-button')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => game.reset());
});
export {};

import type { Piece, Position, Move, PieceColor, PieceType } from './types.js';

class ChessGame {
    private board: (Piece | null)[][];
    private currentPlayer: PieceColor = 'white';
    private selectedPiece: Position | null = null;
    private validMoves: Position[] = [];
    private isComputerThinking: boolean = false;
    private isGameOver: boolean = false;
    private isCheck: boolean = false;
    private checkDialogTimeout: number | null = null;

    constructor() {
        this.board = this.createInitialBoard();
        this.initializeGame();
    }

    private createInitialBoard(): (Piece | null)[][] {
        return Array(8).fill(null).map(() => Array(8).fill(null));
    }

    private initializeGame() {
        // 初始化棋子位置
        const pieces: [PieceType, number][] = [
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

    private renderBoard() {
        const chessboard = document.getElementById('chessboard')!;
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

    private getPieceSymbol(piece: Piece): string {
        // 使用SVG图标作为棋子
        return `<div class="chess-piece ${piece.color}-piece piece-${piece.type}"></div>`;
    }

    private handleSquareClick(row: number, col: number) {
        // 如果是电脑思考中或游戏结束，不允许操作
        if (this.isComputerThinking || this.isGameOver) return;
        
        // 只允许玩家操作白棋
        if (this.currentPlayer === 'black') return;

        const clickedSquare: Position = { row, col };
        const piece = this.board[row][col];

        if (this.selectedPiece) {
            if (this.isValidMove(this.selectedPiece, clickedSquare)) {
                this.makeMove(this.selectedPiece, clickedSquare);
                
                // 玩家下完，切换到电脑
                this.currentPlayer = 'black';
                this.renderBoard();
                
                // 检查是否将军或将死
                if (this.isKingInCheck('black')) {
                    this.isCheck = true;
                    this.showCheckDialog();
                    if (this.isCheckmate('black')) {
                        this.isGameOver = true;
                        const status = document.getElementById('status')!;
                        status.textContent = '将死！白方获胜！';
                        return;
                    }
                } else {
                    this.isCheck = false;
                }
                
                // 电脑走棋（稍微延迟，增加体验感）
                this.isComputerThinking = true;
                setTimeout(() => {
                    this.makeComputerMove();
                    this.isComputerThinking = false;
                }, 500);
            } else {
                this.selectedPiece = null;
                this.validMoves = [];
                this.renderBoard();
                this.highlightValidMoves();
            }
        } else if (piece && piece.color === 'white') {
            this.selectedPiece = clickedSquare;
            this.validMoves = this.getValidMoves(clickedSquare);
            this.renderBoard();
            this.highlightValidMoves();
        }
    }

    // 显示将军对话框
    private showCheckDialog() {
        const dialog = document.getElementById('check-dialog');
        if (dialog) {
            // 清除之前的超时
            if (this.checkDialogTimeout !== null) {
                window.clearTimeout(this.checkDialogTimeout);
            }
            
            // 显示对话框
            dialog.classList.add('show');
            
            // 设置2秒后自动隐藏
            this.checkDialogTimeout = window.setTimeout(() => {
                dialog.classList.remove('show');
                this.checkDialogTimeout = null;
            }, 2000);
        }
    }

    private isValidMove(from: Position, to: Position): boolean {
        return this.validMoves.some(move => 
            move.row === to.row && move.col === to.col
        );
    }

    private getValidMoves(pos: Position): Position[] {
        const piece = this.board[pos.row][pos.col];
        if (!piece) return [];

        const moves: Position[] = [];
        
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

        // 过滤掉会导致自己被将军的移动
        return this.filterMovesPreventingCheck(pos, moves);
    }

    // 过滤掉会导致自己被将军的移动
    private filterMovesPreventingCheck(from: Position, moves: Position[]): Position[] {
        const piece = this.board[from.row][from.col];
        if (!piece) return [];

        return moves.filter(to => {
            // 临时移动棋子
            const capturedPiece = this.board[to.row][to.col];
            this.board[to.row][to.col] = piece;
            this.board[from.row][from.col] = null;

            // 检查移动后是否会导致自己被将军
            const inCheck = this.isKingInCheck(piece.color);

            // 恢复棋盘状态
            this.board[from.row][from.col] = piece;
            this.board[to.row][to.col] = capturedPiece;

            // 如果移动后不会被将军，这是一个有效的移动
            return !inCheck;
        });
    }

    // 检查指定颜色的王是否被将军
    private isKingInCheck(color: PieceColor): boolean {
        // 找到王的位置
        const kingPosition = this.findKingPosition(color);
        if (!kingPosition) return false;

        // 检查对方的每个棋子是否可以攻击到王
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === opponentColor) {
                    const moves = this.getAllPossibleMoves({ row, col });
                    if (moves.some(move => move.row === kingPosition.row && move.col === kingPosition.col)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    // 检查是否将死（王被将军且无法移动）
    private isCheckmate(color: PieceColor): boolean {
        // 如果王没有被将军，不是将死
        if (!this.isKingInCheck(color)) return false;

        // 检查该方的每个棋子是否有有效移动来解除将军
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    const validMoves = this.getValidMoves({ row, col });
                    if (validMoves.length > 0) {
                        return false; // 有有效移动，不是将死
                    }
                }
            }
        }
        
        // 如果没有找到任何有效移动，则是将死
        return true;
    }

    // 找到指定颜色的王的位置
    private findKingPosition(color: PieceColor): Position | null {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    // 获取棋子所有可能的移动（包括可能导致自己被将军的移动）
    private getAllPossibleMoves(pos: Position): Position[] {
        const piece = this.board[pos.row][pos.col];
        if (!piece) return [];

        const moves: Position[] = [];
        
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

    // 实际执行移动，并更新游戏状态
    private makeMove(from: Position, to: Position) {
        const piece = this.board[from.row][from.col];
        if (!piece) return;

        this.board[to.row][to.col] = piece;
        this.board[from.row][from.col] = null;

        if (piece.type === 'pawn') {
            piece.hasMoved = true;
        }
        
        this.selectedPiece = null;
        this.validMoves = [];
    }

    private getPawnMoves(pos: Position, moves: Position[]) {
        const direction = this.board[pos.row][pos.col]?.color === 'white' ? -1 : 1;
        const startRow = this.board[pos.row][pos.col]?.color === 'white' ? 6 : 1;

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
            const newCol = pos.col + offset;
            if (this.isValidPosition(pos.row + direction, newCol)) {
                const targetPiece = this.board[pos.row + direction][newCol];
                if (targetPiece && targetPiece.color !== this.board[pos.row][pos.col]?.color) {
                    moves.push({ row: pos.row + direction, col: newCol });
                }
            }
        });
    }

    private getRookMoves(pos: Position, moves: Position[]) {
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        this.getSlidingMoves(pos, moves, directions);
    }

    private getKnightMoves(pos: Position, moves: Position[]) {
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
                if (!targetPiece || (targetPiece.color !== currentPiece?.color)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
    }

    private getBishopMoves(pos: Position, moves: Position[]) {
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        this.getSlidingMoves(pos, moves, directions);
    }

    private getQueenMoves(pos: Position, moves: Position[]) {
        this.getRookMoves(pos, moves);
        this.getBishopMoves(pos, moves);
    }

    private getKingMoves(pos: Position, moves: Position[]) {
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
                if (!targetPiece || (targetPiece.color !== currentPiece?.color)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
    }

    private getSlidingMoves(pos: Position, moves: Position[], directions: number[][]) {
        const currentPiece = this.board[pos.row][pos.col];
        if (!currentPiece) return;

        directions.forEach(([rowDir, colDir]) => {
            let newRow = pos.row + rowDir;
            let newCol = pos.col + colDir;

            while (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
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

    private isValidPosition(row: number, col: number): boolean {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    private movePiece(from: Position, to: Position) {
        this.makeMove(from, to);
    }

    private highlightValidMoves() {
        if (!this.selectedPiece) return;

        const squares = document.querySelectorAll('.square');
        squares.forEach((square, index) => {
            const row = Math.floor(index / 8);
            const col = index % 8;

            if (row === this.selectedPiece!.row && col === this.selectedPiece!.col) {
                square.classList.add('selected');
            }

            if (this.validMoves.some(move => move.row === row && move.col === col)) {
                square.classList.add('valid-move');
            }
        });
    }

    private updateStatus() {
        const status = document.getElementById('status')!;
        if (this.isGameOver) {
            return; // 游戏结束状态已经设置了
        } else if (this.isComputerThinking) {
            status.textContent = '电脑正在思考...';
        } else if (this.isCheck && this.currentPlayer === 'white') {
            status.textContent = '警告：您被将军了！请解除威胁';
        } else {
            status.textContent = `轮到${this.currentPlayer === 'white' ? '您(白方)' : '电脑(黑方)'}走棋`;
        }
    }

    private makeComputerMove() {
        // 寻找所有可移动的黑棋
        const allPossibleMoves: { from: Position, to: Position }[] = [];
        
        // 收集所有黑棋的可能移动（已经过滤掉会导致自己被将军的移动）
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === 'black') {
                    const from: Position = { row, col };
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
            const status = document.getElementById('status')!;
            
            // 判断是将死还是逼和
            if (this.isKingInCheck('black')) {
                status.textContent = '将死！白方获胜！';
            } else {
                status.textContent = '逼和！游戏结束';
            }
            return;
        }
        
        // 为AI设置策略
        // 1. 如果能将军，优先将军
        const checkMoves = allPossibleMoves.filter(move => {
            // 临时移动
            const piece = this.board[move.from.row][move.from.col];
            const capturedPiece = this.board[move.to.row][move.to.col];
            
            this.board[move.to.row][move.to.col] = piece;
            this.board[move.from.row][move.from.col] = null;
            
            // 检查是否将军
            const isCheck = this.isKingInCheck('white');
            
            // 恢复棋盘
            this.board[move.from.row][move.from.col] = piece;
            this.board[move.to.row][move.to.col] = capturedPiece;
            
            return isCheck;
        });
        
        // 2. 如果能吃子，次优先吃子
        const captureMoves = allPossibleMoves.filter(move => 
            this.board[move.to.row][move.to.col] !== null
        );
        
        let selectedMove;
        
        if (checkMoves.length > 0) {
            // 随机选择一个将军行动
            selectedMove = checkMoves[Math.floor(Math.random() * checkMoves.length)];
        } else if (captureMoves.length > 0) {
            // 随机选择一个吃子行动
            selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
        } else {
            // 否则随机选择一个行动
            selectedMove = allPossibleMoves[Math.floor(Math.random() * allPossibleMoves.length)];
        }
        
        // 移动棋子
        this.makeMove(selectedMove.from, selectedMove.to);
        
        // 切换回玩家的回合
        this.currentPlayer = 'white';
        
        // 检查是否将军或将死
        if (this.isKingInCheck('white')) {
            this.isCheck = true;
            this.showCheckDialog(); // 当电脑将军玩家时，也显示对话框
            if (this.isCheckmate('white')) {
                this.isGameOver = true;
                const status = document.getElementById('status')!;
                status.textContent = '将死！黑方获胜！';
                this.renderBoard();
                return;
            }
        } else {
            this.isCheck = false;
        }
        
        this.renderBoard();
    }

    public reset() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.isComputerThinking = false;
        this.isGameOver = false;
        this.isCheck = false;
        
        // 清除对话框超时
        if (this.checkDialogTimeout !== null) {
            window.clearTimeout(this.checkDialogTimeout);
            this.checkDialogTimeout = null;
        }
        
        this.initializeGame();
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new ChessGame();
    document.getElementById('reset-button')?.addEventListener('click', () => game.reset());
});
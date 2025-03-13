import { Piece, Position, Move, PieceColor, PieceType } from './types';

class ChessGame {
    private board: (Piece | null)[][];
    private currentPlayer: PieceColor = 'white';
    private selectedPiece: Position | null = null;
    private validMoves: Position[] = [];

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
        const symbols: Record<PieceType, string[]> = {
            king: ['♔', '♚'],
            queen: ['♕', '♛'],
            rook: ['♖', '♜'],
            bishop: ['♗', '♝'],
            knight: ['♘', '♞'],
            pawn: ['♙', '♟']
        };
        return symbols[piece.type][piece.color === 'white' ? 0 : 1];
    }

    private handleSquareClick(row: number, col: number) {
        const clickedSquare: Position = { row, col };
        const piece = this.board[row][col];

        if (this.selectedPiece) {
            if (this.isValidMove(this.selectedPiece, clickedSquare)) {
                this.movePiece(this.selectedPiece, clickedSquare);
                this.selectedPiece = null;
                this.validMoves = [];
                this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
            } else {
                this.selectedPiece = null;
                this.validMoves = [];
            }
        } else if (piece && piece.color === this.currentPlayer) {
            this.selectedPiece = clickedSquare;
            this.validMoves = this.getValidMoves(clickedSquare);
        }

        this.renderBoard();
        this.highlightValidMoves();
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

        return moves;
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
                if (targetPiece && targetPiece.color !== this.currentPlayer) {
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
                if (!targetPiece || targetPiece.color !== this.currentPlayer) {
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
                if (!targetPiece || targetPiece.color !== this.currentPlayer) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
    }

    private getSlidingMoves(pos: Position, moves: Position[], directions: number[][]) {
        directions.forEach(([rowDir, colDir]) => {
            let newRow = pos.row + rowDir;
            let newCol = pos.col + colDir;

            while (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (targetPiece.color !== this.currentPlayer) {
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
        const piece = this.board[from.row][from.col];
        if (!piece) return;

        this.board[to.row][to.col] = piece;
        this.board[from.row][from.col] = null;

        if (piece.type === 'pawn') {
            piece.hasMoved = true;
        }
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
        status.textContent = `轮到${this.currentPlayer === 'white' ? '白' : '黑'}方走棋`;
    }

    public reset() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.initializeGame();
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new ChessGame();
    document.getElementById('reset-button')?.addEventListener('click', () => game.reset());
}); 
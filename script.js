let boardSize = 8;
let verticalCount = 0;
let horizontalCount = 0;
let aiMode = "minimax"; // or "minimax"
const board = document.getElementById("board");
const playerDisplay = document.getElementById("playerDisplay");
const status = document.getElementById("status");

let currentPlayer = "Vertical";
let grid = Array(boardSize * boardSize).fill(null);
let gameMode = "multi";
let playerSide = "Vertical";
let gameOver = false;

function chooseSide() {
	const input = document.getElementById("boardSizeInput").value;
	const size = parseInt(input);

	if (isNaN(size) || size < 3 || size > 10) {
		alert("Please enter a number between 3 and 10.");
		return;
	}

	boardSize = size;
	document.getElementById("menu").style.display = "none";
	document.getElementById("sideChoice").style.display = "block";
}

function confirmBoardSize() {
	const input = document.getElementById("boardSizeInput").value;
	const size = parseInt(input);

	if (isNaN(size) || size < 3 || size > 10) {
		alert("Please enter a number between 3 and 10.");
		return;
	}

	boardSize = size;

	document.getElementById("sizeSelect").style.display = "none";
	document.getElementById("menu").style.display = "block";
}

function startGame(mode, side = "Vertical") {
	// Validate board size if starting from menu
	const input = document.getElementById("boardSizeInput").value;
	const size = parseInt(input);

	if (isNaN(size) || size < 3 || size > 10) {
		alert("Please enter a number between 3 and 10.");
		return;
	}

	boardSize = size;

	// 💡 Always recalculate counts
	const totalDominos = Math.floor((boardSize * boardSize) / 2);
	verticalCount = Math.floor(totalDominos / 2);
	horizontalCount = totalDominos - verticalCount;

	document.getElementById("verticalCount").textContent = verticalCount;
	document.getElementById("horizontalCount").textContent = horizontalCount;

	gameMode = mode;
	playerSide = side;
	currentPlayer = "Vertical";
	grid = Array(boardSize * boardSize).fill(null);
	gameOver = false;

	document.getElementById("menu").style.display = "none";
	document.getElementById("sideChoice").style.display = "none";
	document.getElementById("game").style.display = "block";

	renderBoard();

	if (gameMode === "single" && currentPlayer !== playerSide) {
		setTimeout(makeAIMove, 500);
	}
}

function renderBoard() {
	board.innerHTML = "";
	board.style.gridTemplateColumns = `repeat(${boardSize}, 60px)`;
	board.style.gridTemplateRows = `repeat(${boardSize}, 60px)`;
	for (let i = 0; i < boardSize * boardSize; i++) {
		const cell = document.createElement("div");
		cell.classList.add("cell");
		cell.dataset.index = i;
		cell.addEventListener("click", handleClick);
		cell.addEventListener("mouseenter", handleHover);
		cell.addEventListener("mouseleave", clearPreview);
		board.appendChild(cell);
	}
	playerDisplay.textContent = currentPlayer === "Vertical" ? "Lata" : "Raj";
	status.textContent = "";
}

function handleClick(e) {
	if (gameOver) return;
	const index = parseInt(e.target.dataset.index);
	const row = Math.floor(index / boardSize);
	const col = index % boardSize;

	if (gameMode === "single" && currentPlayer !== playerSide) return;

	if (currentPlayer === "Vertical") {
		if (
			row < boardSize - 1 &&
			grid[index] === null &&
			grid[index + boardSize] === null
		) {
			markCell(index, "vertical");
			markCell(index + boardSize, "vertical");
			verticalCount--;
			document.getElementById("verticalCount").textContent =
				verticalCount;
			switchTurn();
		}
	} else {
		if (
			col < boardSize - 1 &&
			grid[index] === null &&
			grid[index + 1] === null
		) {
			markCell(index, "horizontal");
			markCell(index + 1, "horizontal");
			horizontalCount--;
			document.getElementById("horizontalCount").textContent =
				horizontalCount;
			switchTurn();
		}
	}

	if (gameMode === "single" && currentPlayer !== playerSide && !gameOver) {
		setTimeout(makeAIMove, 500);
	}
}

function handleHover(e) {
	if (gameOver) return;

	const index = parseInt(e.target.dataset.index);
	const row = Math.floor(index / boardSize);
	const col = index % boardSize;

	let valid = false;

	if (currentPlayer === "Vertical") {
		if (
			row < boardSize - 1 &&
			grid[index] === null &&
			grid[index + boardSize] === null
		) {
			board.children[index].classList.add("preview-vertical");
			board.children[index + boardSize].classList.add("preview-vertical");
			valid = true;
		}
	} else {
		if (
			col < boardSize - 1 &&
			grid[index] === null &&
			grid[index + 1] === null
		) {
			board.children[index].classList.add("preview-horizontal");
			board.children[index + 1].classList.add("preview-horizontal");
			valid = true;
		}
	}

	// In single player, don't show preview if it's AI's turn
	if (gameMode === "single" && currentPlayer !== playerSide) {
		clearPreview();
	}
}

function clearPreview() {
	for (const cell of board.children) {
		cell.classList.remove("preview-vertical");
		cell.classList.remove("preview-horizontal");
	}
}

function makeAIMove() {
	document.getElementById("aiThinking").style.display = "block";
	setTimeout(() => {
		const isAIVertical = playerSide === "Horizontal";

		const bestMove =
			aiMode === "greedy"
				? pickGreedySmartMove(grid, isAIVertical)
				: minimax(
						grid.slice(),
						6,
						isAIVertical,
						-Infinity,
						Infinity,
						isAIVertical
				  )[0];

		console.log("AI chose:", bestMove);

		document.getElementById("aiThinking").style.display = "none";

		if (bestMove) {
			const [i1, i2] = bestMove;
			const type = isAIVertical ? "vertical" : "horizontal";
			markCell(i1, type);
			markCell(i2, type);

			if (type === "vertical") {
				verticalCount--;
				document.getElementById("verticalCount").textContent =
					verticalCount;
			} else {
				horizontalCount--;
				document.getElementById("horizontalCount").textContent =
					horizontalCount;
			}

			const opponent =
				currentPlayer === "Vertical" ? "Horizontal" : "Vertical";
			if (!hasMoves(opponent)) {
				status.textContent = currentPlayer + " Wins!";
				gameOver = true;
				return;
			}

			switchTurn();
		} else {
			currentPlayer = isAIVertical ? "Vertical" : "Horizontal";
			checkGameOver();
		}
	}, 50);
}

function minimax(state, depth, isVertical, alpha, beta, aiIsVertical) {
	if (depth === 0 || isTerminal(state, isVertical)) {
		return [null, evaluate(state, aiIsVertical)];
	}

	let bestMove = null;
	let bestScore = isVertical ? -Infinity : Infinity;

	const moves = generateMoves(state, isVertical ? "Vertical" : "Horizontal");

	for (const move of moves) {
		const [i1, i2] = move;
		state[i1] = "temp";
		state[i2] = "temp";

		// Check if opponent has NO moves right now
		const opponentMoves = generateMoves(
			state,
			!isVertical ? "Vertical" : "Horizontal"
		);
		if (opponentMoves.length === 0) {
			// this move guarantees a win — no need to search deeper
			state[i1] = null;
			state[i2] = null;
			return [move, 1000];
		}

		const [, score] = minimax(
			state,
			depth - 1,
			!isVertical,
			alpha,
			beta,
			aiIsVertical
		);

		state[i1] = null;
		state[i2] = null;

		if (isVertical) {
			if (score > bestScore) {
				bestScore = score;
				bestMove = move;
			}
			alpha = Math.max(alpha, bestScore);
		} else {
			if (score < bestScore) {
				bestScore = score;
				bestMove = move;
			}
			beta = Math.min(beta, bestScore);
		}

		if (beta <= alpha) break; // alpha-beta pruning
	}

	return [bestMove, bestScore];
}

function classifyCell(grid, index, isVertical) {
	const row = Math.floor(index / boardSize);
	const col = index % boardSize;
	if (grid[index] !== null) return "none";

	const canVertical =
		row < boardSize - 1 &&
		grid[index] === null &&
		grid[index + boardSize] === null;

	const canHorizontal =
		col < boardSize - 1 && grid[index] === null && grid[index + 1] === null;

	if (canVertical && !canHorizontal) return "vertical-only";
	if (!canVertical && canHorizontal) return "horizontal-only";
	if (canVertical && canHorizontal) return "neutral";
	return "none";
}

function pickGreedySmartMove(grid, isVertical) {
	const moves = generateMoves(grid, isVertical ? "Vertical" : "Horizontal");

	// Check for forced win first
	for (const move of moves) {
		const [i1, i2] = move;
		const tempGrid = grid.slice();
		tempGrid[i1] = "temp";
		tempGrid[i2] = "temp";

		const opponent = isVertical ? "Horizontal" : "Vertical";
		if (generateMoves(tempGrid, opponent).length === 0) {
			console.log("FORCED WIN FOUND!", move);
			return move;
		}
	}

	// No instant win, use greedy scoring
	let bestMove = null;
	let bestScore = -Infinity;

	for (const move of moves) {
		const [i1, i2] = move;
		let score = 0;

		for (const idx of [i1, i2]) {
			const kind = classifyCell(grid, idx, isVertical);
			if (
				(isVertical && kind === "vertical-only") ||
				(!isVertical && kind === "horizontal-only")
			) {
				score -= 5; // your own safe zone
			} else if (
				(isVertical && kind === "horizontal-only") ||
				(!isVertical && kind === "vertical-only")
			) {
				score += 1; // opponent-only zone
			} else if (kind === "neutral") {
				score += 3;
			}
		}

		if (score > bestScore) {
			bestScore = score;
			bestMove = move;
		}
	}

	return bestMove;
}

function generateMoves(state, player) {
	const moves = [];
	for (let i = 0; i < state.length; i++) {
		const row = Math.floor(i / boardSize);
		const col = i % boardSize;
		if (player === "Vertical") {
			if (
				row < boardSize - 1 &&
				state[i] === null &&
				state[i + boardSize] === null
			) {
				moves.push([i, i + boardSize]);
			}
		} else {
			if (
				col < boardSize - 1 &&
				state[i] === null &&
				state[i + 1] === null
			) {
				moves.push([i, i + 1]);
			}
		}
	}
	return moves;
}

function isTerminal(state, isVertical) {
	const player = isVertical ? "Vertical" : "Horizontal";
	return generateMoves(state, player).length === 0;
}

function evaluate(state, aiIsVertical) {
	const moves = generateMoves(
		state,
		aiIsVertical ? "Vertical" : "Horizontal"
	);

	let score = 0;

	for (const move of moves) {
		for (const idx of move) {
			const kind = classifyCell(state, idx, aiIsVertical);
			if (
				(aiIsVertical && kind === "vertical-only") ||
				(!aiIsVertical && kind === "horizontal-only")
			) {
				score -= 5;
			} else if (
				(aiIsVertical && kind === "horizontal-only") ||
				(!aiIsVertical && kind === "vertical-only")
			) {
				score += 1;
			} else if (kind === "neutral") {
				score += 3;
			}
		}
	}

	return score;
}

function countAvailableMoves(player) {
	let count = 0;
	for (let i = 0; i < grid.length; i++) {
		const row = Math.floor(i / boardSize);
		const col = i % boardSize;

		if (player === "Vertical") {
			if (
				row < boardSize - 1 &&
				grid[i] === null &&
				grid[i + boardSize] === null
			)
				count++;
		} else {
			if (col < boardSize - 1 && grid[i] === null && grid[i + 1] === null)
				count++;
		}
	}
	return count;
}

function markCell(index, type) {
	grid[index] = type;
	const cell = board.children[index];
	cell.classList.add(type);
	cell.removeEventListener("click", handleClick);
}

function switchTurn() {
	currentPlayer = currentPlayer === "Vertical" ? "Horizontal" : "Vertical";
	playerDisplay.textContent = currentPlayer === "Vertical" ? "Lata" : "Raj";
	checkGameOver();
}

function checkGameOver() {
	const verticalMoves = hasMoves("Vertical");
	const horizontalMoves = hasMoves("Horizontal");

	if (currentPlayer === "Vertical" && !verticalMoves) {
		status.textContent = "Raj Wins!";
		gameOver = true;
	} else if (currentPlayer === "Horizontal" && !horizontalMoves) {
		status.textContent = "Lata Wins!";
		gameOver = true;
	}
}

function hasMoves(player) {
	for (let i = 0; i < grid.length; i++) {
		const row = Math.floor(i / boardSize);
		const col = i % boardSize;
		if (player === "Vertical") {
			if (
				row < boardSize - 1 &&
				grid[i] === null &&
				grid[i + boardSize] === null
			)
				return true;
		} else {
			if (col < boardSize - 1 && grid[i] === null && grid[i + 1] === null)
				return true;
		}
	}
	return false;
}

function goHome() {
	document.getElementById("menu").style.display = "block";
	document.getElementById("sideChoice").style.display = "none";
	document.getElementById("game").style.display = "none";
	board.innerHTML = "";
	status.textContent = "";

	// Reset counters
	verticalCount = 0;
	horizontalCount = 0;
	document.getElementById("verticalCount").textContent = "";
	document.getElementById("horizontalCount").textContent = "";
}

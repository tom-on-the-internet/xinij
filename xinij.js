let xinijContainer = document.getElementById("xinij")

const style = document.createElement("style")
style.textContent = `
    #xinij {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    #xinij-canvas {
        max-width: 100%;
        display: block;
    }
    #xinij-scoreboard {
        color: #fff;
        font-size: 20px;
        text-align: center;
        font-family: monospace;
        width: 100%;
        margin-bottom: 10px;
    }
    #xinij-control-panel {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 20px;
        width: 100%;
    }
    #xinij-control-panel button {
        font-size: 15px;
        padding: 10px 20px;
        background-color: #05AAAA;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
    #play-again-btn {
        font-size: 15px;
        padding: 10px 20px;
        background-color: #AA01AA;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 20px;
    }
`
document.head.appendChild(style)

xinijContainer.innerHTML = ""

let canvas = document.createElement("canvas")
canvas.id = "xinij-canvas"
canvas.width = Math.min(640, window.innerWidth - 50)
canvas.height = Math.floor((canvas.width * 3) / 4)

let scoreBoard = document.createElement("div")
scoreBoard.id = "xinij-scoreboard"
scoreBoard.style.width = `${canvas.width}px`

let controlPanel = document.createElement("div")
controlPanel.id = "xinij-control-panel"
controlPanel.style.width = `${canvas.width}px`

const directions = [
    { id: "up", label: "Up" },
    { id: "left", label: "Left" },
    { id: "down", label: "Down" },
    { id: "right", label: "Right" },
]

// Create a container for the directional buttons
const directionContainer = document.createElement("div")
directionContainer.style.display = "grid"
directionContainer.style.gridTemplateRows = "repeat(3, 50px)"
directionContainer.style.gridTemplateColumns = "repeat(3, 50px)"
directionContainer.style.gap = "5px"
directionContainer.style.justifyItems = "center"
directionContainer.style.alignItems = "center"
directionContainer.style.width = "160px"
directionContainer.style.height = "160px"

// Map direction to grid position
const gridPositions = {
    up: { row: 1, col: 2 },
    left: { row: 2, col: 1 },
    down: { row: 3, col: 2 },
    right: { row: 2, col: 3 },
}

directions.forEach((dir) => {
    const btn = document.createElement("button")
    btn.id = dir.id
    btn.textContent = dir.label
    btn.style.gridRow = gridPositions[dir.id].row
    btn.style.gridColumn = gridPositions[dir.id].col
    directionContainer.appendChild(btn)
})

controlPanel.appendChild(directionContainer)

xinijContainer.appendChild(scoreBoard)
xinijContainer.appendChild(canvas)
xinijContainer.appendChild(controlPanel)

const ctx = canvas.getContext("2d")

const ROWS = 48
const COLS = 64
const CELL_SIZE = canvas.width / COLS

const EMPTY = 0
const FILLED = 1
const TRAIL = 2
const ENEMY = 3
const FILLED_ENEMY = 4

let level = 1
let grid = []
let player = {}
let enemies = []
let gameOver = false
let completion = 0

function onGameOver() {
    gameOver = true
    xinijContainer.dispatchEvent(
        new CustomEvent("GameOver", { detail: { won: false }, bubbles: true })
    )
}

function restartGame() {
    if (level > 5) {
        level = 1
    }

    gameOver = false
    initialize()
}

function updateScoreBoard() {
    if (level > 5) {
        scoreBoard.innerHTML = `Congratulations! You completed all levels!`
        return
    }

    let msg = `Level: ${level}/5 (${completion}%)`

    if (gameOver) {
        msg += ` You died! Click to try again.`
    }

    scoreBoard.innerHTML = msg
}

function getEnemies() {
    let arrangements = {
        1: [
            { x: 4, y: 4, dx: 1, dy: 1, type: ENEMY },
            { x: COLS - 5, y: 4, dx: -1, dy: 1, type: ENEMY },
            { x: 4, y: ROWS - 5, dx: 1, dy: -1, type: ENEMY },
            { x: 20, y: 1, dx: -1, dy: 1, type: FILLED_ENEMY },
        ],
        2: [
            { x: COLS - 6, y: ROWS - 6, dx: -1, dy: -1, type: ENEMY },
            { x: 6, y: ROWS - 7, dx: 1, dy: -1, type: ENEMY },
            { x: COLS - 7, y: 7, dx: -1, dy: 1, type: ENEMY },
            { x: 10, y: 10, dx: 1, dy: 1, type: ENEMY },
            { x: 40, y: 1, dx: 1, dy: 1, type: FILLED_ENEMY },
        ],
        3: [
            { x: 8, y: 4, dx: 1, dy: 1, type: ENEMY },
            { x: COLS - 8, y: ROWS - 8, dx: -1, dy: -1, type: ENEMY },
            { x: 4, y: ROWS - 8, dx: 1, dy: -1, type: ENEMY },
            { x: COLS - 4, y: 8, dx: -1, dy: 1, type: ENEMY },
            { x: 20, y: 1, dx: -1, dy: 1, type: FILLED_ENEMY },
            { x: 40, y: 1, dx: 1, dy: 1, type: FILLED_ENEMY },
        ],
        4: [
            { x: 4, y: 4, dx: 1, dy: 1, type: ENEMY },
            { x: COLS - 5, y: ROWS - 5, dx: -1, dy: -1, type: ENEMY },
            { x: 4, y: ROWS - 6, dx: 1, dy: -1, type: ENEMY },
            { x: COLS - 6, y: 4, dx: -1, dy: 1, type: ENEMY },
            { x: 20, y: 5, dx: 1, dy: 1, type: ENEMY },
            { x: 20, y: 1, dx: -1, dy: 1, type: FILLED_ENEMY },
            { x: 40, y: 1, dx: 1, dy: 1, type: FILLED_ENEMY },
        ],
        5: [
            { x: 7, y: 4, dx: 1, dy: 1, type: ENEMY },
            { x: COLS - 8, y: ROWS - 7, dx: -1, dy: -1, type: ENEMY },
            { x: 4, y: ROWS - 8, dx: 1, dy: -1, type: ENEMY },
            { x: COLS - 4, y: 8, dx: -1, dy: 1, type: ENEMY },
            { x: 20, y: 5, dx: 1, dy: 1, type: ENEMY },
            { x: 30, y: 10, dx: -1, dy: 1, type: ENEMY },
            { x: 20, y: 1, dx: -1, dy: 1, type: FILLED_ENEMY },
            { x: 40, y: 1, dx: 1, dy: 1, type: FILLED_ENEMY },
            { x: 40, y: ROWS - 1, dx: 1, dy: 1, type: FILLED_ENEMY },
        ],
    }
    return arrangements[level]
}

function initialize() {
    completion = 0
    grid = []
    for (let y = 0; y < ROWS; y++) {
        grid[y] = []
        for (let x = 0; x < COLS; x++) {
            if (x <= 1 || y <= 1 || x >= COLS - 2 || y >= ROWS - 2) {
                grid[y][x] = FILLED
            } else {
                grid[y][x] = EMPTY
            }
        }
    }

    player = { x: Math.floor(COLS / 2), y: 0, dx: 0, dy: 0 }

    enemies = getEnemies().map((e) => ({
        x: e.x,
        y: e.y,
        dx: e.dx,
        dy: e.dy,
        type: e.type || ENEMY,
    }))
}

function draw() {
    updateScoreBoard()
    ctx.fillStyle = "#222"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (grid[y][x] === FILLED) {
                ctx.fillStyle = "#05AAAA"
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
            } else if (grid[y][x] === TRAIL) {
                ctx.fillStyle = "#AA01AA"
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
            }

            if (player.x === x && player.y === y) {
                ctx.fillStyle = grid[y][x] === FILLED ? "#AA01AA" : "#AAAAAA"

                const px = x * CELL_SIZE
                const py = y * CELL_SIZE
                const border = CELL_SIZE * 0.2

                ctx.fillRect(px, py, CELL_SIZE, border)
                ctx.fillRect(px, py + CELL_SIZE - border, CELL_SIZE, border)
                ctx.fillRect(px, py + border, border, CELL_SIZE - 2 * border)
                ctx.fillRect(
                    px + CELL_SIZE - border,
                    py + border,
                    border,
                    CELL_SIZE - 2 * border
                )
            }
        }
    }

    // Draw enemies
    for (const e of enemies) {
        ctx.fillStyle = e.type === FILLED_ENEMY ? "#222" : "#AAAAAA"
        if (grid[e.y][e.x] === TRAIL) {
            ctx.fillStyle = "#FF0000"
            ctx.fillRect(e.x * CELL_SIZE, e.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
            ctx.fillStyle = "#FFFF00"
        }
        if (e.type === FILLED_ENEMY) {
            // Draw filled enemy as a square
            ctx.fillRect(
                e.x * CELL_SIZE + 1,
                e.y * CELL_SIZE + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2
            )

            // ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        } else {
            // Draw other enemies as circles
            ctx.beginPath()
            ctx.arc(
                e.x * CELL_SIZE + CELL_SIZE / 2,
                e.y * CELL_SIZE + CELL_SIZE / 2,
                CELL_SIZE / 2 - 2,
                0,
                Math.PI * 2
            )
            ctx.fill()
        }
    }
}

function floodFill(x, y, mark, visited) {
    if (
        x < 0 ||
        y < 0 ||
        x >= COLS ||
        y >= ROWS ||
        grid[y][x] !== EMPTY ||
        visited[y][x]
    ) {
        return
    }

    visited[y][x] = true
    grid[y][x] = mark
    floodFill(x + 1, y, mark, visited)
    floodFill(x - 1, y, mark, visited)
    floodFill(x, y + 1, mark, visited)
    floodFill(x, y - 1, mark, visited)
}

function fillArea() {
    // Fill all TRAIL cells with FILLED
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (grid[y][x] === TRAIL) {
                grid[y][x] = FILLED
            }
        }
    }

    // Find all empty cells reachable from enemies
    let visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false))
    for (const e of enemies) {
        floodFill(e.x, e.y, EMPTY, visited)
    }

    // Fill all other empty cells
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (grid[y][x] === EMPTY && !visited[y][x]) {
                grid[y][x] = FILLED
            }
        }
    }
}

function setCompletion() {
    let totalCells = (ROWS - 4) * (COLS - 4)
    let filledCells = 0

    for (let y = 1; y < ROWS - 1; y++) {
        for (let x = 1; x < COLS - 1; x++) {
            if (grid[y][x] === FILLED) {
                filledCells++
            }
        }
    }

    completion = Math.floor((filledCells / totalCells) * 100)
}

function movePlayer() {
    if (gameOver) return
    let nx = player.x + player.dx
    let ny = player.y + player.dy

    // At bounds
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
        player.dx = 0
        player.dy = 0
        return
    }

    // Didn't move
    if (nx === player.x && ny === player.y) {
        return
    }

    // Collided with enemy
    if (grid[ny][nx] === ENEMY) {
        onGameOver()
        return
    }

    // Collided with own trail
    if (grid[ny][nx] === TRAIL) {
        onGameOver()
        return
    }

    // Claimed a new cell
    if (grid[ny][nx] === EMPTY) {
        grid[ny][nx] = TRAIL
    }

    // Complete a trail
    if (grid[ny][nx] === FILLED && grid[player.y][player.x] === TRAIL) {
        fillArea()
        setCompletion()
        player.dx = 0
        player.dy = 0
        if (completion >= 75) {
            level++
            if (level > 5) {
                xinijContainer.dispatchEvent(
                    new CustomEvent("GameOver", {
                        detail: { won: true },
                        bubbles: true,
                    })
                )
                gameOver = true
                return
            }
            initialize()
            return
        }
    }

    player.x = nx
    player.y = ny
}

function moveEnemies() {
    for (const e of enemies) {
        let nx = e.x + e.dx
        let ny = e.y + e.dy
        if (e.type === FILLED_ENEMY) {
            // Only move on FILLED
            // Bounds check for ny and nx
            if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
                if (grid[ny][nx] !== FILLED) {
                    // Bounce logic
                    if (
                        ny >= 0 &&
                        ny < grid.length &&
                        grid[ny][e.x] !== FILLED &&
                        nx >= 0 &&
                        nx < grid[0].length &&
                        grid[e.y][nx] !== FILLED
                    ) {
                        e.dy *= -1
                        e.dx *= -1
                    } else if (
                        ny >= 0 &&
                        ny < grid.length &&
                        grid[ny][e.x] !== FILLED
                    ) {
                        e.dy *= -1
                    } else if (
                        nx >= 0 &&
                        nx < grid[0].length &&
                        grid[e.y][nx] !== FILLED
                    ) {
                        e.dx *= -1
                    } else {
                        e.dy *= -1
                        e.dx *= -1
                    }
                    nx = e.x + e.dx
                    ny = e.y + e.dy
                }
                // Check bounds before comparing with player
                if (nx === player.x && ny === player.y) {
                    onGameOver()
                }
                // Check bounds before accessing grid
                if (
                    ny >= 0 &&
                    ny < grid.length &&
                    nx >= 0 &&
                    nx < grid[0].length &&
                    grid[ny][nx] === FILLED
                ) {
                    e.x = nx
                    e.y = ny
                }
            } else {
                // Bounce on bounds
                if (ny < 0 || ny >= grid.length) {
                    e.dy *= -1
                }
                if (nx < 0 || nx >= grid[0].length) {
                    e.dx *= -1
                }
                nx = e.x + e.dx
                ny = e.y + e.dy
                // After bouncing, check if new position is valid
                if (
                    ny >= 0 &&
                    ny < grid.length &&
                    nx >= 0 &&
                    nx < grid[0].length &&
                    grid[ny][nx] !== FILLED
                ) {
                    e.x = nx
                    e.y = ny
                }
            }
        } else {
            // Normal enemy logic (as before)
            if (grid[e.y][e.x] === FILLED) continue
            if (grid[ny][nx] === FILLED) {
                if (grid[ny][e.x] === FILLED && grid[e.y][nx] === FILLED) {
                    e.dy *= -1
                    e.dx *= -1
                } else if (grid[ny][e.x] === FILLED) {
                    e.dy *= -1
                } else if (grid[e.y][nx] === FILLED) {
                    e.dx *= -1
                } else {
                    e.dy *= -1
                    e.dx *= -1
                }
                nx = e.x + e.dx
                ny = e.y + e.dy
            }
            if (grid[ny][nx] === TRAIL) {
                onGameOver()
            }
            e.x = nx
            e.y = ny
        }
    }
    for (const e of enemies) {
        if (e.x === player.x && e.y === player.y) {
            onGameOver()
        }
    }
}

xinijContainer.addEventListener("pointerdown", (e) => {
    if (e.target.id === "left") {
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft" })
        )
    } else if (e.target.id === "up") {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }))
    } else if (e.target.id === "down") {
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowDown" })
        )
    } else if (e.target.id === "right") {
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight" })
        )
    }
})

canvas.addEventListener("pointerdown", (e) => {
    if (gameOver) {
        restartGame()
    }
})

document.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault()
    }

    if (gameOver) return

    let makingTrail = grid[player.y][player.x] === TRAIL

    if (e.key === "ArrowUp") {
        if (player.dy === 1 && makingTrail) return
        player.dx = 0
        player.dy = -1
    } else if (e.key === "ArrowDown") {
        if (player.dy === -1 && makingTrail) return
        player.dx = 0
        player.dy = 1
    } else if (e.key === "ArrowLeft") {
        if (player.dx === 1 && makingTrail) return
        player.dx = -1
        player.dy = 0
    } else if (e.key === "ArrowRight") {
        if (player.dx === -1 && makingTrail) return
        player.dx = 1
        player.dy = 0
    }
})

async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function gameLoop() {
    if (!gameOver) {
        movePlayer()
        moveEnemies()
    }
    draw()

    // Control game speed
    await wait(40)
    requestAnimationFrame(gameLoop)
}

initialize()
gameLoop()

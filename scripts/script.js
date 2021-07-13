'use strict'
/* global getRandomFrom, mod */

const ctx = document.getElementById('game').getContext('2d')

class Shape {
  constructor (name, data, rot, offset) {
    this.name = name
    this.offset = offset || { x: 0, y: 0 }
    this.rotation = rot || 0
    this.data = data || []
  }

  get currentBits () {
    return this.data[this.rotation]
  }

  rotate (rot) {
    this.rotation = mod(this.rotation + rot, 4)
  }

  rotated (rot) {
    return new Shape(this.name, this.data, mod(this.rotation + rot, 4), this.offset)
  }

  translated (x, y) {
    return new Shape(this.name, this.data, this.rotation, { x: x, y: y })
  }

  isColliding () {
    const offsetPosition = { x: this.offset.x, y: this.offset.y }
    for (let x = 0; x < this.getArray().length; x++) {
      for (let y = 0; y < this.getArray()[x].length; y++) {
        const value = this.getArray()[x][y]
        if (value === 1) {
          if (Game.Board.tiles[offsetPosition.x + x] === undefined) { return true }
          if (Game.Board.tiles[offsetPosition.x + x][offsetPosition.y + y] === undefined) { return true }
          if (value && Game.Board.tiles[offsetPosition.x + x][offsetPosition.y + y].occupant !== null) { return true }
        }
      }
    }
    return false
  }

  getArray () {
    const array = [[], [], [], []]
    this.currentBits.split('').forEach((bit, index) => {
      const x = index % 4
      const y = Math.ceil((index + 1) / 4) - 1
      array[x][y] = parseInt(bit)
    })
    return array
  }

  prettyPrint () {
    let string = ''
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        string += this.currentBits[(y * 4) + x]
      }
      string += '\n'
    }
    console.log(string)
  }
}

const ShapeData = {
  I: { name: 'I', data: ['0000111100000000', '0010001000100010', '0000000011110000', '0100010001000100'] },
  J: { name: 'J', data: ['1000111000000000', '0110010001000000', '0000111000100000', '0100010011000000'] },
  L: { name: 'L', data: ['0010111000000000', '0100010001100000', '0000111010000000', '1100010001000000'] },
  O: { name: 'O', data: ['0110011000000000', '0110011000000000', '0110011000000000', '0110011000000000'] },
  S: { name: 'S', data: ['0110110000000000', '0100011000100000', '0000011011000000', '1000110001000000'] },
  T: { name: 'T', data: ['0100111000000000', '0100011001000000', '0000111001000000', '0100110001000000'] },
  Z: { name: 'Z', data: ['1100011000000000', '0010011001000000', '0000110001100000', '0100110010000000'] }
}

class Type {
  constructor (name, textureName, prey = null, predator = null) {
    this.name = name || 'Basic'
    this.textureName = textureName || 'Basic.png'
    this.texture = new Image()
    this.texture.src = './resources/' + this.textureName
    this.predator = predator
    this.prey = prey
  }
}

const Types = {
  Wolf: new Type('Wolf', 'Wolf.png', 'Sheep'),
  Hay: new Type('Hay', 'Hay.png', 'none', 'Sheep'),
  Sheep: new Type('Sheep', 'Sheep.png', 'Hay', 'Wolf'),
  Basic: new Type('Basic', 'Basic.png')
}

class Piece {
  constructor (shape, type) {
    const shapeData = getRandomFrom(ShapeData)
    this.shape = shape || new Shape(shapeData.name, shapeData.data)
    this.position = { x: 3, y: 0 }
    this.type = Types.Basic || type || getRandomFrom(Types)
  }

  kick (x, y, rot) {
    if (!this.shape.translated(this.position.x + x, this.position.y + y).rotated(rot).isColliding()) {
      console.log('kick', x, y, rot)
      this.move(x, y, true)
      this.shape.rotate(rot)
      return true
    }
    return false
  }

  move (x, y, force = false) {
    if (!this.shape.translated(this.position.x + x, this.position.y + y).isColliding() || force) {
      this.position = { x: this.position.x + x, y: this.position.y + y }
      return true
    }
    return false
  }

  rotate (rot) {
    if (!this.shape.translated(this.position.x, this.position.y).rotated(rot).isColliding()) {
      this.shape.rotate(rot)
      return true
    } else {
      let data = []
      // SRS Kick Data, check out: https://tetris.fandom.com/wiki/SRS#Basic_Rotation
      const kicks = {
        Other: {
          CW: [
            [[-1, 0], [-1, 1], [0, -2], [-1, -2]],
            [[1, 0], [1, -1], [0, 2], [1, 2]],
            [[1, 0], [1, 1], [0, -2], [1, -2]],
            [[-1, 0], [-1, -1], [0, 2], [-1, -2]]
          ],
          CCW: [
            [[1, 0], [1, -1], [0, 2], [1, 2]],
            [[-1, 0], [-1, 1], [0, -2], [-1, -2]],
            [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
            [[1, 0], [1, 1], [0, -2], [1, -2]]
          ]
        },
        I: {
          CW: [
            [[-2, 0], [1, 0], [-2, -1], [1, 2]],
            [[-1, 0], [2, 0], [-1, 2], [2, -1]],
            [[2, 0], [-1, 0], [2, 1], [-1, -2]],
            [[1, 0], [-2, 0], [1, -2], [-2, 1]]
          ],
          CCW: [
            [[2, 0], [-1, 0], [2, 1], [-1, -2]],
            [[1, 0], [-2, 0], [1, -2], [-2, 1]],
            [[-2, 0], [1, 0], [-2, -1], [1, 2]],
            [[-1, 0], [2, 0], [-1, 2], [2, -1]]
          ]
        }
      }

      if (this.shape.name === 'I') {
        if (rot === 1) {
          data = kicks.I.CW[this.shape.rotation]
        } else {
          data = kicks.I.CCW[this.shape.rotation]
        }
      } else {
        if (rot === 1) {
          data = kicks.Other.CW[this.shape.rotation]
        } else {
          data = kicks.Other.CCW[this.shape.rotation]
        }
      }
      // console.log(data, `kicks.${this.shape.name}.${['CCW', '', 'CW'][rot + 1]}[${this.shape.rotation}]`)
      let point = {}
      for (let i = 0; i <= 3; i++) {
        point = { x: data[i][0], y: data[i][1] }
        if (this.kick(point.x, -point.y, rot)) { return true }
      }
    }
    return false
  }

  plant () {
    this.shape.getArray().forEach((arr, x) => {
      arr.forEach((value, y) => {
        if (value) { Game.Board.setTile(this.position.x + x, this.position.y + y, new Tile(this.position.x + x, this.position.y + y, this)) }
      })
    })
    this.getNeighbors().forEach(neighbor => {
      console.log(neighbor)
      if (this.type.predator === neighbor.type.name) { this.unplant() }
      if (this.type.prey === neighbor.type.name) { neighbor.unplant() }
    })
  }

  unplant () {
    this.shape.getArray().forEach((arr, x) => {
      arr.forEach((value, y) => {
        if (value) { Game.Board.setTile(this.position.x + x, this.position.y + y, new Tile(this.position.x + x, this.position.y + y, null)) }
      })
    })
  }

  drop () {
    while (true) {
      if (!Game.activePiece.move(0, 1)) { Game.spawnNewPiece(); return }
    }
  }

  getNeighbors () {
    const neighbors = new Set()
    this.shape.getArray().forEach((arr, x) => {
      arr.forEach((value, y) => {
        if (value) {
          Game.Board.getNeighboringTiles(this.position.x + x, this.position.y + y).forEach(tile => {
            if (tile) { neighbors.add(tile.occupant) }
          })
        }
      })
    })
    neighbors.delete(new Tile())
    neighbors.delete(this)
    neighbors.delete(null)
    return neighbors
  }

  draw (xPos = this.position.x, yPos = this.position.y) {
    ctx.fillStyle = '#FFF'
    this.shape.getArray().forEach((arr, x) => {
      arr.forEach((value, y) => {
        if (value) { Game.Board.drawTile(xPos + x, yPos + y, this.type) }
      })
    })
  }
};

class Tile {
  constructor (x, y, occupant) {
    this.position = { x: x, y: y }
    this.occupant = occupant || null
  }
}

const Game = {
  activePiece: new Piece(),
  next: {
    content: [new Piece(), new Piece(), new Piece(), new Piece()],
    draw () {
      this.content.forEach((piece, index) => {
        piece.draw(11, 2.5 + (index * 3))
      })
    }
  },
  hold: {
    content: [null, null],
    draw () {
      this.content.forEach((piece, index) => {
        if (piece) { piece.draw(10 + (index * 5), 15) }
      })
    },
    swap (slot) {
      const prevActivePiece = Game.activePiece
      console.log(this.content[slot] !== null)
      if (this.content[slot] !== null) {
        this.content[slot] = prevActivePiece
        Game.activePiece = this.content[slot]
      } else {
        this.content[slot] = prevActivePiece
        Game.activePiece = Game.next.content.shift()
        Game.next.content.push(new Piece())
      }
    }
  },
  spawnNewPiece () {
    this.activePiece.plant()
    for (let i = 0; i < 4; i++) {
      if (this.Board.checkLine(Game.activePiece.position.y + i)) {
        this.Board.clearLine(Game.activePiece.position.y + i)
      }
    }
    this.activePiece = Game.next.content.shift()
    Game.next.content.push(new Piece())
    if (Game.hold.content[0]) { Game.hold.content[0].position = { x: 3, y: 0 } }
    if (Game.hold.content[1]) { Game.hold.content[1].position = { x: 3, y: 0 } }
  },
  Board: {
    tiles: [],
    initialize () {
      for (let x = 0; x < 9; x++) {
        this.tiles[x] = []
        for (let y = 0; y < 18; y++) {
          this.tiles[x][y] = new Tile(x, y)
        }
      }
    },
    clearLine (y) {
      if (this.tiles[0][y] === undefined) { return }
      this.tiles.forEach((column) => {
        column.splice(y, 1)
        column.unshift(new Tile())
      })
    },
    checkLine (y) {
      for (let x = 0; x < this.tiles.length; x++) {
        if (this.tiles[x][y] !== undefined) {
          if (!this.tiles[x][y].occupant) {
            return false
          }
        }
      }
      return true
    },
    draw () {
      for (let x = 0; x < this.tiles.length; x++) {
        for (let y = 0; y < this.tiles[0].length; y++) {
          if (this.tiles[x][y].occupant) {
            ctx.drawImage(this.tiles[x][y].occupant.type.texture, 10 + (x * 12), 12 + (y * 12), 12, 12)
          }
        }
      }
    },
    getNeighboringTiles (x, y) {
      const offsets = {
        x: [0, 1, 0, -1],
        y: [-1, 0, 1, 0]
      }
      const result = []
      for (let i = 0; i <= 3; i++) {
        if (this.tiles[x + offsets.x[i]] !== undefined) {
          result.push(this.tiles[x + offsets.x[i]][y + offsets.y[i]])
        } else {
          result.push(null)
        }
      }
      return result
    },
    drawTile (x, y, type) {
      ctx.drawImage(type.texture, 10 + (x * 12), 12 + (y * 12), 12, 12)
    },
    setTile (x, y, tile) {
      this.tiles[x][y] = tile
    }
  },
  Controls: {
    keyMap: {},
    mapKey (key, func, type = 'keydown') {
      window.removeEventListener(type, Game.Controls.keyMap[key]) // Unbind the previous key, if it exists.
      window.addEventListener(type, Game.Controls.keyMap[key] = (event) => {
        if (event.key === key) {
          func()
        }
      })
    }
  }
}

Game.Board.initialize()

Game.Controls.mapKey('ArrowLeft', () => { Game.activePiece.move(-1, 0) })
Game.Controls.mapKey('ArrowRight', () => { Game.activePiece.move(1, 0) })
Game.Controls.mapKey('ArrowUp', () => { Game.activePiece.move(0, -1) })
Game.Controls.mapKey('ArrowDown', () => { Game.activePiece.move(0, 1) })
Game.Controls.mapKey('z', () => { Game.activePiece.rotate(-1) })
Game.Controls.mapKey('x', () => { Game.activePiece.rotate(1) })
Game.Controls.mapKey(' ', () => { Game.activePiece.drop() })
Game.Controls.mapKey('c', () => { Game.hold.swap(0) })
Game.Controls.mapKey('v', () => { Game.hold.swap(1) })

requestAnimationFrame(draw)

setInterval(update, 2000)

function update () {
  if (!Game.activePiece.move(0, 0)) { Game.spawnNewPiece() }
}

function draw (timestamp) {
  ctx.clearRect(0, 0, 256, 240)
  ctx.fillStyle = 'white'
  Game.Board.draw()
  Game.activePiece.draw()
  Game.hold.draw()
  Game.next.draw()
  requestAnimationFrame(draw)
}

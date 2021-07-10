'use strict'
/* global getRandomFrom, mod */

const ctx = document.getElementById('canvas').getContext('2d')

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
    // console.log(this.pretty())
    for (let x = 0; x < this.getArray().length; x++) {
      for (let y = 0; y < this.getArray()[x].length; y++) {
        const value = this.getArray()[x][y]
        if (value === 1) {
          if (Game.Board.tiles[offsetPosition.x + x] === undefined) { console.log('x-bound', x, y); return true }
          if (Game.Board.tiles[offsetPosition.x + x][offsetPosition.y + y] === undefined) { console.log('y-bound'); return true }
          if (value && Game.Board.tiles[offsetPosition.x + x][offsetPosition.y + y].occupant !== null) { console.log('collide'); return true }
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

  pretty () {
    let string = ''
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        string += this.currentBits[(y * 4) + x]
      }
      string += '\n'
    }
    return string
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
  constructor (name, textureName) {
    this.name = name || 'NoName'
    this.textureName = textureName || 'Basic.png'
    this.texture = new Image()
    this.texture.src = this.textureName
  }
}

const Types = {
  Wolf: new Type('Wolf', 'Wolf.png'),
  Hay: new Type('Hay', 'Hay.png'),
  Sheep: new Type('Sheep', 'Sheep.png')
}

class Piece {
  constructor (shape, type) {
    const shapeData = getRandomFrom(ShapeData)
    this.shape = shape || new Shape(shapeData.name, shapeData.data)
    this.position = { x: 3, y: 0 }
    this.type = type || getRandomFrom(Types)
  }
  /*
    NEXT STEP: Put move() and rotate() with kick
  */

  move (x, y) {
    if (!this.shape.translated(this.position.x + x, this.position.y + y).isColliding()) {
      this.position = { x: this.position.x + x, y: this.position.y + y }
      return true
    }
    return false
  }

  rotate (rot) {
    if (!this.shape.translated(this.position.x, this.position.y).rotated(rot).isColliding()) {
      this.shape.rotate(rot)
      return true
    }
    return false
  }

  plant () {
    this.shape.getArray().forEach((arr, x) => {
      arr.forEach((value, y) => {
        if (value) { Game.Board.setTile(this.position.x + x, this.position.y + y, new Tile(this.position.x + x, this.position.y + y, this)) }
      })
    })
  }

  drop () {
    while (true) {
      if (!Game.activePiece.move(0, 1)) { Game.spawnNewPiece(); return }
    }
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
    content: [new Piece(), new Piece()],
    draw () {
      this.content.forEach((piece, index) => {
        piece.draw(10 + (index * 5), 15)
      })
    },
    swap (slot) {
      const prevActivePiece = Game.activePiece
      Game.activePiece = this.content[slot]
      if (this.content[slot]) {
        this.content[slot] = prevActivePiece
      } else {
        this.activePiece = Game.next.content.shift()
        Game.next.content.push(new Piece())
      }
    }
  },
  spawnNewPiece () {
    this.activePiece.plant()
    for (let i = 0; i < 4; i++) {
      console.log(Game.activePiece.position.y + i - 1)
      if (this.Board.checkLine(Game.activePiece.position.y + i)) {
        this.Board.clearLine(Game.activePiece.position.y + i)
      }
    }
    this.activePiece = Game.next.content.shift()
    Game.next.content.push(new Piece())
    Game.hold.content[0].position = { x: 3, y: 0 }
    Game.hold.content[1].position = { x: 3, y: 0 }
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
      console.log('clearing line', y)
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

Game.Controls.mapKey('Enter', () => { console.log('Hello World') })
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
  if (!Game.activePiece.move(0, 1)) { Game.spawnNewPiece() }
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
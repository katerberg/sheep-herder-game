import {Map} from 'rot-js';
import {colors, topOffset} from './constants';
import {Position} from './definitions/position';
import {Tile} from './tile';

export class GameMap {
  private startGatePosition: Position;

  private endGatePosition: Position;

  private tiles: Tile[][];

  private seenTiles: {[key: `${number},${number}`]: Tile};

  constructor(width: number, height: number) {
    this.tiles = [];
    this.seenTiles = {};
    const map = new Map.Cellular(width, height);
    const mapCallback = (x: number, y: number, contents: number): void => {
      const tileX = x;
      const tileY = y + topOffset;
      if (!this.tiles[tileX]) {
        this.tiles[tileX] = [];
      }
      this.tiles[tileX][tileY] = new Tile(tileX, tileY, contents === 1);
    };
    map.randomize(0.55);
    Array.from(Array(5).keys()).forEach(() => {
      map.create(mapCallback.bind(this));
    });
    map.connect(mapCallback.bind(this), 1);
    const startTile = this.getRandomTile(this.tiles[topOffset].length - 1, false);
    this.startGatePosition = {
      x: startTile.x,
      y: startTile.y,
    };
    const endTile = this.getRandomTile(topOffset, true);
    this.endGatePosition = {
      x: endTile.x,
      y: endTile.y,
    };
  }

  getStartGate(): Tile {
    return this.tiles[this.startGatePosition.x][this.startGatePosition.y];
  }

  getEndGate(): Tile {
    return this.tiles[this.endGatePosition.x][this.endGatePosition.y];
  }

  matchesGate(x: number, y: number): boolean {
    return (
      (this.startGatePosition.x === x && this.startGatePosition.y === y) ||
      (this.endGatePosition.x === x && this.endGatePosition.y === y)
    );
  }

  drawDemonFire(burningSpaces: number): void {
    const fireColors = [
      colors.DEMON_FIRE_5, // lightest
      colors.DEMON_FIRE_4,
      colors.DEMON_FIRE_3,
      colors.DEMON_FIRE_2,
      colors.DEMON_FIRE_1, // darkest
    ];

    for (let y = 0; y < burningSpaces; y++) {
      for (let x = 0; x < this.tiles.length; x++) {
        const percentage = (fireColors.length * y) / burningSpaces + 0.02;
        globalThis.display.draw(
          x,
          this.tiles[1].length - 1 - y,
          '',
          null,
          fireColors[Math.random() > 0.5 ? Math.ceil(percentage) : Math.floor(percentage)],
        );
      }
    }
  }

  drawTiles(): void {
    this.tiles.forEach((tileRow) =>
      tileRow.forEach((tile) => {
        if (this.seenTiles[`${tile.x},${tile.y}`]) {
          tile.draw();
        }
      }),
    );
  }

  isSeenTile(x: number, y: number): boolean {
    return !!this.seenTiles[`${x},${y}`];
  }

  isNonWallTile(x: number, y: number): boolean {
    return !!this.getTile(x, y)?.isPassable;
  }

  seeTile(position: `${number},${number}`): void {
    if (this.seenTiles[position] !== undefined) {
      return;
    }

    const [x, y] = position.split(',');
    this.seenTiles[position] = this.tiles[x as unknown as number]?.[y as unknown as number] || null;
  }

  private getTile(x: number, y: number): Tile | undefined {
    return this.tiles?.[x]?.[y];
  }

  private getRandomTile(startRow: number, increasing: boolean): Tile {
    let tile: Tile | undefined = undefined;
    for (let rowNumber = startRow; !tile; rowNumber += increasing ? 1 : -1) {
      const filteredColumns = this.tiles.filter((column) => column[rowNumber].isPassable);
      if (filteredColumns.length) {
        tile = filteredColumns[Math.floor(Math.random() * filteredColumns.length)][rowNumber];
      }
    }
    return tile;
  }
}

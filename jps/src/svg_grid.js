import React from 'react';

const Obstacle = 1;
const Start = 3;
const Destinatin = 2;
const Visited = 5;
const Path = 6;

const CellDistance = 1;
const DiagDistance = Math.sqrt(2);

class SvgGrid extends React.Component {
    constructor(props) {
        super(props);
        this.width = props.width;
        this.height = props.height;                
        this.cellsize = props.cellsize;
        this.rows = Math.floor(this.height / this.cellsize);
        this.cols = Math.floor(this.width / this.cellsize);

        let bitmap = Array.from({length: this.rows}).map(x => Array.from({length: this.cols}).map(x => 0));
        this.startpos = [0, 0];
        this.endpos = [this.rows-1, this.cols-1];
        
        let [x, y] = this.startpos;
        bitmap[x][y] = Start;
        [x, y] = this.endpos;
        bitmap[x][y] = Destinatin;

        this.state = {
            'bitmap': bitmap
        }

        this.onClickCell = this.onClickCell.bind(this);
        this.astar = this.astar.bind(this);
        this.jps = this.jps.bind(this);
    }

    path_search(bitmap) {        
        // clear current path
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (bitmap[row][col] == Path) {
                    bitmap[row][col] = 0;
                }
            }
        }

        let path = this.astar(bitmap);
        for (let point of path) {
            bitmap[point[0]][point[1]] = Path;
        }

        return bitmap;
    }

    onClickCell(row, col) {
        let bitmap = this.state.bitmap.map((arr) => arr.slice());
        bitmap[row][col] = Obstacle;

        this.path_search(bitmap);

        this.setState({
            'bitmap': bitmap
        });
    }

    getNeighbours(row, col) {
        let neighbours = [];
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                let nRow = row + rowOffset;
                let nCol = col + colOffset;
                if (nRow >= 0 && nRow < this.rows && nCol >= 0 && nCol < this.cols) {
                    neighbours.push([nRow, nCol]);
                }
            }
        }
        return neighbours;
    }

    isDestination(point) {
        let [x, y] = point;
        let [dx, dy] = this.endpos;
        return x === dx && y === dy;
    }

    calcSquaredDistanceToDest(point) {
        let [x, y] = point;
        let [dx, dy] = this.endpos;
        return (x - dx) * (x - dx) + (y - dy) * (y - dy);
    }

    calNeighbourDistance(p1, p2) {
        let [x1, y1] = p1;
        let [x2, y2] = p2;
        if (x1 === x2 || y1 === y2) {
            return CellDistance;
        }
        return DiagDistance;
    }

    constructPath(predecessors) {
        let current = this.endpos;
        let path = [];

        current = predecessors[current];
        while (current !== undefined && current !== this.startpos) {
            path.push(current);
            current = predecessors[current];
        }
        return path.reverse();
    }

    jpsCalcDistanceBetweenJumpPoint(posA, posB) {
        let xA, yA = posA;
        let xB, yB = posB;
        
        if (xA == xB) {
            return Math.abs(yA - yB) * CellDistance;
        } else if (yA == yB) {
            return Math.abs(xA - xB) * CellDistance;
        } else {
            if (Math.abs(xA - xB) != Math.abs(yA - yB)) {
                alert("ERROR: Math.abs(xA - xB) != Math.abs(yA - yB)")
                return;
            }
            return (xA - xB) * DiagDistance;
        }
    }

    astar(bitmap) {
        let cost_to_point = new Proxy({}, {
            get: (obj, name) => name in obj ? obj[name] : Number.POSITIVE_INFINITY
        });

        let cost_to_dest = new Proxy({}, {
            get: (obj, name) => name in obj ? obj[name] : Number.POSITIVE_INFINITY
        })

        cost_to_point[this.startpos] = 0;

        let openset = [];
        let predecessors = {};

        openset.push(this.startpos);

        while (openset.length > 0) {
            openset.sort((a, b) => cost_to_dest[b] - cost_to_dest[a]);
            
            let currentPoint = openset.pop();            

            if (this.isDestination(currentPoint)) {
                if (predecessors.length === 0) return [];
                return this.constructPath(predecessors);
            }

            let currentCost = cost_to_point[currentPoint];
            let neighbours = this.getNeighbours(...currentPoint);
            for (let neighbour of neighbours) {
                let [x, y] = neighbour;
                let score = bitmap[x][y];
                if (score === Obstacle) {
                    // obstacle
                    continue;
                }

                // grid itself is uniform-cost                
                let newCost = currentCost + this.calNeighbourDistance(currentPoint, neighbour);
                if (newCost < cost_to_point[neighbour]) {
                    predecessors[neighbour] = currentPoint;
                    let estimateCost = newCost + this.calcSquaredDistanceToDest(neighbour);
                    cost_to_point[neighbour] = newCost;
                    cost_to_dest[neighbour] = estimateCost;
                    predecessors[neighbour] = currentPoint;

                    if (!openset.includes(neighbour)) {
                        openset.push(neighbour);
                    }
                }                
            }
        }

        return [];
    }

    jpsHorizontallySearch(bitmap, pos, dirX) {
        let posX, posY = pos;
        let aboveY = posY + 1;
        let belowY = posY - 1;
        let searchAbove = 0 <= aboveY < this.height;
        let searchBelow = 0 <= belowY < this.height;

        let jumpPoints = [];
        for (let x = posX; 0 <= x < this.width-1; x+=dirX) {
            if (bitmap[x][posY] == Obstacle) {
                return [];
            }

            if (searchAbove) {
                if (bitmap[x][aboveY] == Obstacle) {
                    if (0 <= x + dirX < this.width) {
                        if (bitmap[x+dirX][aboveY] != Obstacle) {
                            jumpPoints.append([x, aboveY]);
                        }
                    }
                }
            }

            if (searchBelow) {
                if (bitmap[x][belowY] == Obstacle) {
                    if (0 <= x + dirX < this.height) {
                        if (bitmap[x+dirX][belowY] != Obstacle) {
                            jumpPoints.append([x, belowY]);
                        }                       
                    }
                }
            }
        }
    }

    jpsVerticallySearch(bitmap, pos, dirY) {
        let posX, posY = pos;
    }

    jpsDiagonallySearch(bitmap, pos, dir) {
        let dirX, dirY = dir;
    }

    findJumpPoint(bitmap, pos) {
        let neighbours = self.getNeighbours(...currentPos);
        for (let neighbour of neighbours) {
            let neighbourX, neighbourY = neighbour;
            let currentPosX, currentPosY = currentPos;
            let dirX = currentPosX - neighbourX;
            let dirY = currentPosY - neighbourY;
            let dir = [dirX, dirY];
        
            if (dirX !== 0 && dirY !== 0) {
                // search diagonally
                return this.jpsDiagonallySearch(bitmap, pos, dir);
            } else if (dirX == 0) {
                // search horizontally
                return this.jpsVerticallySearch(bitmap, pos, dir);
            } else if (dirY == 0) {
                // search vertically
                return this.jpsHorizontallySearch(bitmap, pos, dir);
            }
        }
    }

    jpsConstructPath(jumpPoints) {
        return jumpPoints;
    }

    jps(bitmap) {   
        let openset = [];
        openset.push(this.endpos);
        let opensetCost = new Proxy({}, {
            get: (obj, name) => name in obj ? obj[name] : Math.POSITIVE_INFINITY
        });

        let costToPoint = new Proxy({}, {
            get: (obj, name) => name in obj ? obj[name] : Math.POSITIVE_INFINITY
        });

        let predecessors = {};
        let path = [];

        while (openset.length > 0) {
            openset.sort((a, b) => opensetCost[b] - opensetCost[a]);
            let currentPos = openset.pop();
            let currentCost = opensetCost[currentPos];
            if (this.isDestination(currentPos)) {
                return this.jpsConstructPath();
            }
            
            let jumpPoints = this.findJumpPoints(bitmap, currentPos);
            for (let jump of jumpPoints) {
                let newCost = currentCost + this.calcSquaredDistanceToDest(jump);
                if (newCost < costToPoint[jump]) {
                    opensetCost[jump] = newCost; 
                    predecessors[jump] = currentPos;
                    costToPoint[jump] = 1;
                }
                let distance = this.calcSquaredDistanceToDest(jump);
            }

        }
    }

    getColor(nValue) {
        switch (nValue) {
            case 0:
                return "white";
            case Obstacle:
                return "gray";
            case Destinatin:
                return "red";
            case Start:
                return "blue";
            case Path:
                return "green";
            case Visited:
                return "cyan"
            default:
                return "white";
        }
    }

    render() {
        const rects = this.state.bitmap.map((rows, i) => {
            return rows.map((cellValue, j) => {
                return (
                    <rect key={i*this.rows + j} x={j * this.cellsize} y={i * this.cellsize} width={this.cellsize} height={this.cellsize} 
                        fill={this.getColor(cellValue)} stroke="gray" strokeWidth={0.5} onClick={(e) => this.onClickCell(i, j)}
                    />);
            });
        });
        return (
            <React.Fragment>
                <svg width={this.width} height={this.height}>
                    {rects}
                </svg>                
            </React.Fragment>
        );
    }
}

export {SvgGrid};
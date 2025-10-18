/*funktion til at returnere et tilfældigt tal mellem min og max. 
Funktionen bruges til at vælge tilfældige startpositioner og naboer*/
function randomInteger(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

/*Denne klasse repræsentere en enkelt celle i labyrinten, hvor x,y er positionen*/
class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.walls = {
      //cellen starter med vægge på alle sider
      top: true,
      right: true,
      bottom: true,
      left: true,
    };
    this.visited = false; //denne variabel bruges til at markere om cellen har været besøgt tidligere
  }

  /*Funktion til at tegne væggene. ctx bruges til at tegne med. cellWallSize er cellens størrelse
    i pixels. */

  draw(ctx, cellWallSize) {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.beginPath();

    const px = this.x * cellWallSize;
    const py = this.y * cellWallSize;

    ctx.moveTo(px, py);

    if (this.walls.left) {
      ctx.lineTo(px, py + cellWallSize);
    } else {
      ctx.moveTo(px, py + cellWallSize);
    }

    if (this.walls.bottom) {
      ctx.lineTo(px + cellWallSize, py + cellWallSize);
    } else {
      ctx.moveTo(px + cellWallSize, py + cellWallSize);
    }

    if (this.walls.right) {
      ctx.lineTo(px + cellWallSize, py);
    } else {
      ctx.moveTo(px + cellWallSize, py);
    }

    if (this.walls.top) {
      ctx.lineTo(px, py);
    } else {
      ctx.moveTo(px, py);
    }

    ctx.stroke();
  }

  // find ikke besægte naboer i grid vha. this.x og this.y
  unvisitedNeighbors(grid) {
    let neighbors = [];

    // Vi er ikke den nordligste celle
    if (this.y > 0) {
      const nord_x = this.x;
      const nord_y = this.y - 1;
      const nord_nabo = grid[nord_x][nord_y];
      if (!nord_nabo.visited) { //hvis ikke nabo mod nord er blevet besøgt, så gem i liste
        neighbors.push(nord_nabo); 
      }
    }

    // Vi er ikke cellen mest til venstre
    if (this.x > 0) {
      const venstre_x = this.x - 1;
      const venstre_y = this.y;
      const venstre_nabo = grid[venstre_x][venstre_y];
      if (!venstre_nabo.visited) { //hvis ikke nabo mod vest er blevet besøgt, så gem i liste
        neighbors.push(venstre_nabo);
      }
    }

    // Vi er ikke den sydligste celle
    if (this.y < grid[0].length - 1) {
      const syd_x = this.x;
      const syd_y = this.y + 1;
      const syd_nabo = grid[syd_x][syd_y];
      if (!syd_nabo.visited) { //hvis ikke nabo mod syd er blevet besøgt, så gem i liste
        neighbors.push(syd_nabo);
      }
    }

    // Vi er ikke cellen mest til højre
    if (this.x < grid.length - 1) {
      const højre_x = this.x + 1;
      const højre_y = this.y;
      const højre_nabo = grid[højre_x][højre_y];
      if (!højre_nabo.visited) { //hvis ikke nabo mod øst er blevet besøgt, så gem i liste
        neighbors.push(højre_nabo);
      }
    }

    return neighbors; //returnerer en liste af nabo-celler, som ikke er besøgt endnu
  }

  punchWallDown(otherCell) {
    const dx = this.x - otherCell.x;
    const dy = this.y - otherCell.y;

    if (dx === 1) {
      // otherCell er til venstre for this
      this.walls.left = false;
      otherCell.walls.right = false;
    } else if (dx === -1) {
      // otherCell er til højre for this
      this.walls.right = false;
      otherCell.walls.left = false;
    } else if (dy === 1) {
      // otherCell er over this
      this.walls.top = false;
      otherCell.walls.bottom = false;
    } else if (dy === -1) {
      // otherCell er under this
      this.walls.bottom = false;
      otherCell.walls.top = false;
    }
  }
}

class Maze {
  constructor(cols, rows, canvas) {
    this.grid = [];
    this.cols = cols;
    this.rows = rows;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cellWallSize = canvas.width / cols; //cellerne er retanglære, så beregnes kun udfra antal kolonner
    this.initializeGrid(); //her kaldes metoden for at oprette alle celler og fylde gitteret
  }

  initializeGrid() {
    for (let i = 0; i < this.cols; i += 1) {
      this.grid.push([]);
      for (let j = 0; j < this.rows; j += 1) {
        this.grid[i].push(new Cell(i, j));
      }
    }
  }

  draw() {
    for (let i = 0; i < this.cols; i += 1) {
      for (let j = 0; j < this.rows; j += 1) {
        this.grid[i][j].draw(this.ctx, this.cellWallSize);
      }
    }
  }

  generate(interval = 30, hopInterval = 8) {
    const start_x = randomInteger(0, this.cols); 
    const start_y = randomInteger(0, this.rows);
    let currentCell = this.grid[start_x][start_y]; //Her vælges et tilfældigt startsted ud fra randomInteger()
    let stack = []; //bruges til recursive backtracking. Her gemmes stien af besøgte celler, så den kan gå tilbage når der er ramt en blindgyde
    let stepCount = 0; //bruges til at sammentælle hvor mange trin der er taget i den nuværende "sti", før et muligt hop

    currentCell.visited = true; //markeres true, da vi starter her

    const step = () => { //Dette er funktionen som udfører ét trin i opbygningen af labyrinten
      
      // Normal DFS maze step
      let unvisitedNeighbors = currentCell.unvisitedNeighbors(this.grid);

      if (unvisitedNeighbors.length > 0) { //hvis currentCell har ikke besøgte naboer
        const randomNeighborCell =
          unvisitedNeighbors[randomInteger(0, unvisitedNeighbors.length)]; //så vælg en af disse
        currentCell.punchWallDown(randomNeighborCell); //og fjern væggen
        stack.push(currentCell); //currentCell gemmes i stack (sti som vi har været på)
        currentCell = randomNeighborCell; //ny currentCell er nabocellen, som vi har fjernet væggen til
        currentCell.visited = true; //Den nye celle angives som visited
        stepCount++; //Der lægges 1 til vores antal trin
      } else {
        currentCell = stack.pop();//Hvis ikke der er ubesøgte naboer, så gå tilbage på den allerede betrådte sti (stack) og tag den seneste
      }

      // Hop til nyt sted efter et vist antal trin (hopInterval)
      if (stepCount > hopInterval) {
        currentCell = null; 
        stepCount = 0;
      }

      if (!currentCell) { //Hvis currentCell er null vil vi "hoppe" til et nyt område
        // Find alle u-besøgte celler der HAR mindst én besøgt nabo
        let candidates = [];
        for (let i = 0; i < this.cols; i++) {
          for (let j = 0; j < this.rows; j++) {
            const cell = this.grid[i][j];
            if (!cell.visited) {
              const neighbors = [
                this.grid[cell.x]?.[cell.y - 1],
                this.grid[cell.x - 1]?.[cell.y],
                this.grid[cell.x]?.[cell.y + 1],
                this.grid[cell.x + 1]?.[cell.y],
              ].filter((n) => n && n.visited);
              if (neighbors.length > 0) {
                candidates.push({ cell, neighbors });
              }
            }
          }
        }

        // Hvis der ikke er nogen kandidater — vi er færdige
        if (candidates.length === 0) {
          clearInterval(timer);
          console.log("✅ Maze generation complete!");
          return;
        }

        // Vælg en tilfældig kandidat
        const { cell, neighbors } =
          candidates[randomInteger(0, candidates.length)];

        // Forbind den til en af dens besøgte naboer
        const neighbor = neighbors[randomInteger(0, neighbors.length)];
        cell.punchWallDown(neighbor);
        cell.visited = true;
        currentCell = cell;

        return;
      }

      // Tegn labyrinten og marker den aktuelle celle
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.draw();

      if (currentCell) {
        const px = currentCell.x * this.cellWallSize;
        const py = currentCell.y * this.cellWallSize;
        this.ctx.fillStyle = "rgba(0, 255, 132, 0.4)";
        this.ctx.fillRect(px, py, this.cellWallSize, this.cellWallSize);
      }
    };

    //dette er timeren, der kalder step-funktionen gentagne gange, så labyrinten skabes
    //med animationseffekt og ikke tegnes på én gang
    const timer = setInterval(step, interval); 
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas");
  const maze = new Maze(20, 20, canvas);

  maze.generate(60, 12); //opdater hvert 3 sek, så

  //maze.draw();

  console.log(maze);
});

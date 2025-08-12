import './style.css'

export interface Tile {
  id: number;
  image?: string;
  description?: string;
  
  //neighboring tiles in each direction
  up?: Tile[];
  down?: Tile[];
  left?: Tile[];
  right?: Tile[];

  upLeft?: Tile[];
  upRight?: Tile[];
  downLeft?: Tile[];
  downRight?: Tile[];
}

// Function to assign each tile's direct neighbors (up, down, left, right) based on its position in the grid
export function updateTileNeighbors(tiles: Tile[], cols: number, rows: number): void {
  for (let y = 0; y < rows; y++) {          // Loop through each row
    for (let x = 0; x < cols; x++) {        // Loop thorugh each col
      const index = y * cols + x;           // Convert 2D pos into an array index
      const tile = tiles[index];            // Get the tile at the index
      
      // Set "up" neighbor if not on the first row, otherwise empty array
      tile.up = y > 0 ? [tiles[(y - 1) * cols + x]] : [];
      
      // Set "down" neighbor if not on the last row
      tile.down = y < rows - 1 ? [tiles[(y + 1) * cols + x]] : [];

      // Set "left" neighbor if not in the first column
      tile.left = x > 0 ? [tiles[y * cols + (x - 1)]] : [];

      // Set "right" neighbor if not in the last column
      tile.right = x < cols - 1 ? [tiles[y * cols + (x + 1)]] : [];

      // Diagonal neighbors
      tile.upLeft = (y > 0 && x > 0) ? [tiles[(y - 1) * cols + (x - 1)]] : [];
      tile.upRight = (y > 0 && x < cols - 1) ? [tiles[(y - 1) * cols + (x + 1)]] : [];
      tile.downLeft = (y < rows - 1 && x > 0) ? [tiles[(y + 1) * cols + (x - 1)]] : [];
      tile.downRight = (y < rows - 1 && x < cols - 1) ? [tiles[(y + 1) * cols + (x + 1)]] : [];
    }
  }
}

// BFS to find the nearest tile that matches a given condition
export function bfsFindNearestMatchingTile(
  start: Tile,
  matchesPattern: (tile: Tile) => boolean): Tile | null {     //Function to test if a tile matches
    const visited = new Set<number>();                        
    const queue: { tile: Tile; dist: number }[] = [];         // Queue for BFS, storing tiles and distance from start

    // Start BFS with the distance 0
    queue.push({ tile: start, dist: 0 });
    visited.add(start.id);

    while (queue.length > 0) {
      const { tile, dist } = queue.shift()!;

      // If not the starting tile and it matches the search condition, return
      if (dist > 0 && matchesPattern(tile)) {
        return tile;
      }

      // Gather all valid neighbors of the current tile
      const neighbors = [
        ...(tile.up || []),
        ...(tile.down || []),
        ...(tile.left || []),
        ...(tile.right || []),
        ...(tile.upLeft || []),
        ...(tile.upRight || []),
        ...(tile.downLeft || []),
        ...(tile.downRight || []),
      ];


      // Add neighbors to the queue if they haven't been visited yet
      for (const n of neighbors) {
        if (!visited.has(n.id)) {
          visited.add(n.id);
          queue.push({ tile: n, dist: dist + 1 });    // Increment distance for BFS
        }
      }
    }
    return null;
}

////////**** Code to take in a tileset and create array. Only edit if you need to ****////////

const imageInput = document.getElementById('imageInput') as HTMLInputElement;
const tileSizeInput = document.getElementById('tileSizeInput') as HTMLInputElement;
const processBtn = document.getElementById('processBtn') as HTMLButtonElement;

processBtn.onclick = async () => {
  const file = imageInput.files?.[0];
  const tileSize = parseInt(tileSizeInput.value, 10);
  if (!file || isNaN(tileSize) || tileSize <= 0) {
    alert('Please select an image and enter a valid tile size.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const cols = Math.floor(img.width / tileSize);
      const rows = Math.floor(img.height / tileSize);
      const tiles: Tile[] = [];
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = tileSize;
      tempCanvas.height = tileSize;
      const tempCtx = tempCanvas.getContext('2d');
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          tempCtx?.clearRect(0, 0, tileSize, tileSize);
          tempCtx?.drawImage(
            img,
            x * tileSize,
            y * tileSize,
            tileSize,
            tileSize,
            0,
            0,
            tileSize,
            tileSize
          );
          const image = tempCanvas.toDataURL();
          tiles.push({
            id: y * cols + x,
            image
          });
        }
      }

      updateTileNeighbors(tiles, cols, rows);

      // If tile found
      for (const tile of tiles) {
        const foundTile = bfsFindNearestMatchingTile(tile, t => t.description?.includes('target') ?? false);
        if (foundTile) {
          console.log(`From tile ${tile.id}, nearest matching tile found: ${foundTile.id}`);
        } else {
          console.log(`From tile ${tile.id}, no matching tile found.`);
        }
      }

      // Display all tile images on screen
      const tileGallery = document.getElementById('tileGallery') || document.createElement('div');
      tileGallery.id = 'tileGallery';
      tileGallery.innerHTML = '';
      tileGallery.style.display = 'flex';
      tileGallery.style.flexWrap = 'wrap';
      tileGallery.style.gap = '4px';

      // Create modal container
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      modal.style.display = 'none';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = '1000';

      const modalContent = document.createElement('div');
      modalContent.style.background = '#fff';
      modalContent.style.padding = '20px';
      modalContent.style.borderRadius = '8px';
      modalContent.style.display = 'flex';
      modalContent.style.flexDirection = 'column';
      modalContent.style.alignItems = 'center';
      modalContent.style.gap = '10px';

      const modalImg = document.createElement('img');
      modalImg.style.border = '2px solid #000';

      const modalNeighbors = document.createElement('div');
      modalNeighbors.style.display = 'flex';
      modalNeighbors.style.flexWrap = 'wrap';
      modalNeighbors.style.gap = '4px';

      const closeBtn = document.createElement('button');
      closeBtn.innerText = 'Close';
      closeBtn.onclick = () => (modal.style.display = 'none');

      modalContent.appendChild(modalImg);
      modalContent.appendChild(modalNeighbors);
      modalContent.appendChild(closeBtn);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // ---- END MODAL CREATION ----

      tiles.forEach(tile => {
        const imgElem = document.createElement('img');
        imgElem.src = tile.image || '';
        imgElem.width = tileSize;
        imgElem.height = tileSize;
        imgElem.style.border = '1px solid #ccc';

        // Tooltip on hover
        imgElem.title = `Tile ID: ${tile.id}\n` +
                        `Up: ${tile.up?.length || 0}\n` +
                        `Down: ${tile.down?.length || 0}\n` +
                        `Left: ${tile.left?.length || 0}\n` +
                        `Right: ${tile.right?.length || 0}`;

        // Click to open modal and show neighbors
        imgElem.onclick = () => {
          modalImg.src = tile.image || '';
          modalImg.width = tileSize * 2;
          modalImg.height = tileSize * 2;

          // Show neighbor tiles
          modalNeighbors.innerHTML = '';
          const addNeighbor = (label: string, neighbors?: Tile[]) => {
            if (!neighbors || neighbors.length === 0) return;
            neighbors.forEach(n => {
              const neighborImg = document.createElement('img');
              neighborImg.src = n.image || '';
              neighborImg.width = tileSize;
              neighborImg.height = tileSize;
              neighborImg.style.border = '2px solid #007bff';
              neighborImg.title = `${label} Neighbor: Tile ID ${n.id}`;
              modalNeighbors.appendChild(neighborImg);
            });
          };

          addNeighbor('Up', tile.up);
          addNeighbor('Down', tile.down);
          addNeighbor('Left', tile.left);
          addNeighbor('Right', tile.right); 
          addNeighbor('Up-Left', tile.upLeft);
          addNeighbor('Up-Right', tile.upRight);
          addNeighbor('Down-Left', tile.downLeft);
          addNeighbor('Down-Right', tile.downRight);

          modal.style.display = 'flex';
        };

        tileGallery.appendChild(imgElem);
      });

      document.body.appendChild(tileGallery);
      console.log('Tiles:', tiles);
      alert(`Created ${tiles.length} tiles. Please check the console for details.`);
      //TODO - Thomas - Add code to validate student results.
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

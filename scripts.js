const canvas = document.getElementById('keyboard-canvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('file-input');
const allowedCharactersInput = document.getElementById('allowed-characters');
const inputText = document.getElementById('input-text');
const resultsContainer = document.getElementById('results');
const contextMenu = document.getElementById('context-menu');
const assignFingerOption = document.getElementById('assign-finger');

let keyboardTemplate = null; // Image of the uploaded keyboard template
let markers = []; // Array to store marker positions
let draggingMarker = null;

const markerFingers = {}; // Stores finger assignments (marker index -> finger)

const MAX_WIDTH = 800;
const MAX_HEIGHT = 400;

const fingerColors = {
  'Left Pinky': 'red',
  'Left Ring': 'orange',
  'Left Middle': 'yellow',
  'Left Index': 'green',
  'Right Index': 'blue',
  'Right Middle': 'purple',
  'Right Ring': 'pink',
  'Right Pinky': 'brown',
  'Thumbs': 'gray',
};

const availableFingers = Object.keys(fingerColors);

// Draw the canvas
function drawCanvas(layout = null) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (keyboardTemplate) {
    ctx.drawImage(keyboardTemplate, 0, 0, canvas.width, canvas.height);
  }

  // Draw all markers
  markers.forEach((marker, index) => {
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, 5, 0, Math.PI * 2);

    // Color markers based on finger assignment
    const finger = markerFingers[index];
    ctx.fillStyle = finger ? fingerColors[finger] : 'red';

    ctx.fill();
    ctx.stroke();

    // Display finger or layout character
    if (layout && layout[index] && layout[index].character) {
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      ctx.fillText(layout[index].character, marker.x + 10, marker.y - 10);
    } else if (finger) {
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      ctx.fillText(finger, marker.x + 10, marker.y - 10);
    }
  });
}

// Handle marker dragging
function startDragging(event) {
  const { offsetX: x, offsetY: y } = event;
  draggingMarker = markers.find(marker => Math.hypot(marker.x - x, marker.y - y) < 10);
}

function dragMarker(event) {
  if (draggingMarker) {
    const { offsetX: x, offsetY: y } = event;
    draggingMarker.x = x;
    draggingMarker.y = y;
    drawCanvas();
  }
}

function stopDragging() {
  draggingMarker = null;
}

// Add a new marker
canvas.addEventListener('dblclick', event => {
  const { offsetX: x, offsetY: y } = event;
  markers.push({ x, y });
  drawCanvas();
});

// Show context menu on right-click
canvas.addEventListener('contextmenu', event => {
  event.preventDefault();
  const { offsetX: x, offsetY: y } = event;
  const markerIndex = markers.findIndex(marker => Math.hypot(marker.x - x, marker.y - y) < 10);

  if (markerIndex !== -1) {
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;

    // Assign finger
    assignFingerOption.onclick = () => {
      const finger = prompt(`Assign a finger to this marker:\n${availableFingers.join(', ')}`);
      if (availableFingers.includes(finger)) {
        markerFingers[markerIndex] = finger;
        drawCanvas();
      }
      contextMenu.style.display = 'none';
    };
  } else {
    contextMenu.style.display = 'none';
  }
});

// Hide context menu on click
document.addEventListener('click', () => {
  contextMenu.style.display = 'none';
});

// Upload keyboard template
document.getElementById('upload-template').addEventListener('click', () => {
  fileInput.accept = '.png';
  fileInput.onchange = event => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scaleFactor = Math.min(MAX_WIDTH / img.width, MAX_HEIGHT / img.height, 1);
          keyboardTemplate = img;
          canvas.width = img.width * scaleFactor;
          canvas.height = img.height * scaleFactor;
          drawCanvas();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };
  fileInput.click();
});

// Save layout as JSON
document.getElementById('save-layout').addEventListener('click', () => {
  const layout = {
    markers,
    allowedCharacters: allowedCharactersInput.value.trim(),
    markerFingers,
  };
  const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'keyboard_layout.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Load layout from JSON
document.getElementById('load-layout').addEventListener('click', () => {
  fileInput.accept = '.json';
  fileInput.onchange = event => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const data = JSON.parse(reader.result);
        markers = data.markers || [];
        allowedCharactersInput.value = data.allowedCharacters || '';
        Object.assign(markerFingers, data.markerFingers || {});
        drawCanvas();
      };
      reader.readAsText(file);
    }
  };
  fileInput.click();
});

// Run optimization algorithm
document.getElementById('run-optimization').addEventListener('click', () => {
  const text = inputText.value.trim();
  const allowedCharacters = allowedCharactersInput.value.trim();

  if (!text || !allowedCharacters) {
    alert('Please enter text and allowed characters for optimization.');
    return;
  }

  const bestLayout = runGenerativeAlgorithm(markers, markerFingers, allowedCharacters, text);
  resultsContainer.innerHTML = `
    <h3>Optimized Layout</h3>
    <p>Total Distance: ${bestLayout.distance.toFixed(2)}</p>
  `;

  // Visualize the optimized layout
  drawCanvas(bestLayout.layout);
});

// Event listeners for dragging
canvas.addEventListener('mousedown', startDragging);
canvas.addEventListener('mousemove', dragMarker);
canvas.addEventListener('mouseup', stopDragging);

// Initial draw
drawCanvas();

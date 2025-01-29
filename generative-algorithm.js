function calculateDistance(layout, text) {
  let totalDistance = 0;
  let lastFingerPositions = {};

  for (const char of text) {
    const marker = layout.find(m => m.character === char);
    if (!marker) continue;

    const finger = marker.finger;
    const position = [marker.x, marker.y];

    if (finger in lastFingerPositions) {
      const [lastX, lastY] = lastFingerPositions[finger];
      const dx = position[0] - lastX;
      const dy = position[1] - lastY;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }

    lastFingerPositions[finger] = position;
  }

  return totalDistance;
}

function runGenerativeAlgorithm(markers, markerFingers, allowedCharacters, text) {
  let layouts = createInitialLayouts(markers, markerFingers, allowedCharacters, text);
  let generation = 0;

  function optimize() {
    if (!optimizationRunning) return;

    layouts = sortLayoutsByDistance(layouts, text);
    layouts = createNextGeneration(layouts);
    generation++;
    
    if (generation % 10 === 0) {
      displayBestLayout(layouts[0]);
    }

    requestAnimationFrame(optimize);
  }

  optimize();
}

function createInitialLayouts(markers, markerFingers, allowedCharacters, text) {
  const layouts = [];

  for (let i = 0; i < 50; i++) {
    let availableCharacters = allowedCharacters.split('');
    let assignedLayout = markers.map((marker, index) => ({
      x: marker.x,
      y: marker.y,
      character: availableCharacters.length > 0 ? availableCharacters.splice(Math.floor(Math.random() * availableCharacters.length), 1)[0] : '',
      finger: markerFingers[index] || 'Unknown'
    }));

    layouts.push({
      layout: assignedLayout,
      distance: calculateDistance(assignedLayout, text),
    });
  }

  return layouts;
}

function sortLayoutsByDistance(layouts, text) {
  layouts.forEach(layout => {
    layout.distance = calculateDistance(layout.layout, text);
  });
  return layouts.sort((a, b) => a.distance - b.distance);
}

function createNextGeneration(layouts) {
  const newLayouts = [];

  for (let i = 0; i < layouts.length / 2; i++) {
    const parent1 = layouts[i].layout;
    const parent2 = layouts[layouts.length - 1 - i].layout;

    const child1 = crossover(parent1, parent2);
    const child2 = crossover(parent2, parent1);

    newLayouts.push({ layout: child1, distance: 0 });
    newLayouts.push({ layout: child2, distance: 0 });
  }

  return newLayouts;
}

function crossover(parent1, parent2) {
  const crossoverPoint = Math.floor(Math.random() * parent1.length);
  return parent1.slice(0, crossoverPoint).concat(parent2.slice(crossoverPoint));
}

function displayBestLayout(bestLayout) {
  const bestLayoutDiv = document.createElement('div');
  bestLayoutDiv.innerHTML = `
    <h3>Best Layout so far</h3>
    <p>Total Distance: ${bestLayout.distance.toFixed(2)}</p>
  `;
  resultsContainer.innerHTML = '';
  resultsContainer.appendChild(bestLayoutDiv);

  drawCanvas(bestLayout.layout);
}

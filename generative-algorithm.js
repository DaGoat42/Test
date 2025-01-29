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

  layouts.sort((a, b) => a.distance - b.distance);
  return layouts[0];
}

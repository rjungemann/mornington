export function useGraphOptions() {
  const graphOptions: GraphOptions = {
    fontFamily: 'Noto Sans, sans-serif',
    hopStrokeWidth: 5,
    stationStroke: '#f5f5f4',
    stationStrokeWidth: 4,
    stationFill: '#0c0a09',
    stationRadius: 8,
    virtualStationRadius: 5,
    trainRadius: 7,
    sourceRadius: 15,
    sourceStroke: '#4ade80',
    sourceStrokeWidth: 2,
    destinationRadius: 15,
    destinationStroke: '#facc15',
    destinationStrokeWidth: 2,
    offset: { x: 0, y: 0 },
    size: { x: 500, y: 500 },
    dropShadowStyle: { filter: 'drop-shadow(0px 1px 1px rgb(0 0 0 / 1.0))' },

    bubbleOffsetY: 24,
    bubbleOffsetX: 12,
    bubbleHeight: 20,
    bubbleStroke: 'none',
    bubbleFill: 'white',
    bubbleStrokeWidth: '0.125',
    bubbleRadius: 5,
    bubbleAgentRadius: 4,
    bubbleAgentPadding: 1.5,
    bubbleTipWidth: 6,
    bubbleTipHeight: 6,

    traversalStroke: 'yellow',
    traversalStrokeWidth: 4,
    traversalOpacity: 1.0,
    traversalMagnitude: 20,

    hazardStroke: 'black',
    hazardStrokeWidth: '0.25',
    hazardScale: 6.7,

    trainScale: 10,
    trainStroke: 'none',
    trainStrokeWidth: '0.25',

    stationTextOffsetY: 24,
    stationTextColor: '#e2e8f0',
    stationFontSize: '0.65em',
    stationSourceOpacity: 0.6,
    stationDestinationOpacity: 0.6,
  }

  return graphOptions
}
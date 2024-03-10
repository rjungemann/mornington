export function useGraphOptions() {
  const graphOptions: GraphOptions = {
    fontFamily: 'Noto Sans, sans-serif',
    hopStrokeWidth: 4,
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
    offset: {
      x: 0,
      y: 0
    },
    size: {
      x: 500,
      y: 500
    }
  }

  return graphOptions
}
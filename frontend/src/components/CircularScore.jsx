import React from 'react';
import ScoreGauge from './ScoreGauge';

/**
 * Backward compatibility wrapper forwarding to minimal tone-based ScoreGauge.
 */
export default function CircularScore(props) {
  return <ScoreGauge {...props} />;
}

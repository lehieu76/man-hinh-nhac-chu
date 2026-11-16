// Ghép layout engine (thuần) với bộ đo chữ của trình duyệt cho một kích thước màn hình cụ thể.
import { computeGeometry } from './layout-geometry.js';
import { tokenize, wrapLines, buildFrame, findLineIndex } from './layout-engine.js';
import { createTextMeasurer, fontString } from './text-measurer.js';

export function createPrompterLayout(script, settings, width, height) {
  const tokens = tokenize(script);
  const geo = computeGeometry({ width, height, ...settings });
  const measure = createTextMeasurer(fontString(settings));
  const spaceW = measure(' ');
  const { paragraphSpacing } = settings;
  const lines = wrapLines(tokens, geo.colW, measure, spaceW, paragraphSpacing);
  return {
    geo,
    lines,
    lastIndex: Math.max(0, lines.length - 1),
    indexForToken: (token) => findLineIndex(lines, token),
    tokenAt: (k) => lines[k]?.start ?? 0,
    frameAt: (k) => buildFrame({ tokens, lines, k, geo, measure, spaceW, paragraphSpacing }),
  };
}

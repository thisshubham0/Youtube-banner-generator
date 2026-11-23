import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampWatermarkOpacity,
  clampWatermarkScale,
  computeWatermarkPlacement,
  getWatermarkExportSpec,
  sanitizeWatermarkFilename,
} from './watermarkLayout';

test('getWatermarkExportSpec returns exact YouTube 150x150, 512x512 HD, and 1200x320 clip dimensions', () => {
  const ytSpec = getWatermarkExportSpec('youtube-square', false);
  assert.equal(ytSpec.width, 150);
  assert.equal(ytSpec.height, 150);

  const hdSpec = getWatermarkExportSpec('youtube-square', true);
  assert.equal(hdSpec.width, 512);
  assert.equal(hdSpec.height, 512);

  const clipSpec = getWatermarkExportSpec('clip-wide', false);
  assert.equal(clipSpec.width, 1200);
  assert.equal(clipSpec.height, 320);
});

test('computeWatermarkPlacement places watermarks cleanly inside all 4 corners without clipping', () => {
  const frameW = 1280;
  const frameH = 720;

  const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
  for (const corner of corners) {
    const rect = computeWatermarkPlacement(frameW, frameH, 'clip-wide', corner, 1.2);
    assert.ok(rect.x > 0, `${corner} x should have left margin`);
    assert.ok(rect.y > 0, `${corner} y should have top margin`);
    assert.ok(rect.x + rect.width < frameW, `${corner} right edge within frame`);
    assert.ok(rect.y + rect.height < frameH, `${corner} bottom edge within frame`);
  }

  const tl = computeWatermarkPlacement(frameW, frameH, 'youtube-square', 'top-left', 1);
  const br = computeWatermarkPlacement(frameW, frameH, 'youtube-square', 'bottom-right', 1);
  assert.equal(tl.width, tl.height);
  assert.ok(br.x > tl.x);
  assert.ok(br.y > tl.y);
});

test('clampWatermarkOpacity and clampWatermarkScale bound values safely', () => {
  assert.equal(clampWatermarkOpacity(0.05), 0.2);
  assert.equal(clampWatermarkOpacity(1.5), 1);
  assert.equal(clampWatermarkOpacity(0.75), 0.75);

  assert.equal(clampWatermarkScale(0.1), 0.6);
  assert.equal(clampWatermarkScale(2.5), 1.3);
  assert.equal(clampWatermarkScale(1.1), 1.1);
});

test('sanitizeWatermarkFilename outputs clean PNG names for @MaCo_original', () => {
  assert.equal(
    sanitizeWatermarkFilename('@MaCo_original', 'clip-wide'),
    'MaCo_original_clip_watermark_1200x320.png'
  );
  assert.equal(
    sanitizeWatermarkFilename('@MaCo_original', 'youtube-square', false),
    'MaCo_original_youtube_watermark_150x150.png'
  );
  assert.equal(
    sanitizeWatermarkFilename('@MaCo_original', 'youtube-square', true),
    'MaCo_original_watermark_badge_512x512.png'
  );
});

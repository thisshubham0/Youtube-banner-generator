import test from 'node:test';
import assert from 'node:assert/strict';
import {
  YT_BANNER_HEIGHT,
  YT_BANNER_WIDTH,
  YT_SAFE_HEIGHT,
  YT_SAFE_WIDTH,
  computeCoverTransform,
  computeTypographyMetrics,
  getYouTubeSafeZones,
  sanitizeExportFilename,
  validateBannerInputs,
} from './bannerLayout';

test('getYouTubeSafeZones computes exact YouTube 2560x1440 crop geometry', () => {
  const zones = getYouTubeSafeZones(YT_BANNER_WIDTH, YT_BANNER_HEIGHT);

  assert.deepEqual(zones.tv, { x: 0, y: 0, width: 2560, height: 1440 });
  assert.deepEqual(zones.desktop, { x: 0, y: 508.5, width: 2560, height: 423 });
  assert.deepEqual(zones.tablet, { x: 352.5, y: 508.5, width: 1855, height: 423 });
  assert.deepEqual(zones.safe, {
    x: 507,
    y: 508.5,
    width: YT_SAFE_WIDTH,
    height: YT_SAFE_HEIGHT,
  });
});

test('getYouTubeSafeZones scales proportionally for half-res preview canvases', () => {
  const zones = getYouTubeSafeZones(1280, 720);
  assert.equal(zones.safe.width, 773);
  assert.equal(zones.safe.height, 211.5);
  assert.equal(zones.safe.x, 253.5);
});

test('computeCoverTransform guarantees full canvas coverage without gaps', () => {
  // 16:9 image into 2560x1440 at 1x zoom
  const fit = computeCoverTransform(1920, 1080, 2560, 1440, 1, 0, 0);
  assert.equal(Math.round(fit.dw), 2560);
  assert.equal(Math.round(fit.dh), 1440);
  assert.equal(fit.dx, 0);
  assert.equal(fit.dy, 0);

  // Zoomed 1.5x and panned to extreme corner still covers entire frame
  const zoomed = computeCoverTransform(1920, 1080, 2560, 1440, 1.5, 50, -50);
  assert.ok(zoomed.dx <= 0);
  assert.ok(zoomed.dy <= 0);
  assert.ok(zoomed.dx + zoomed.dw >= 2560);
  assert.ok(zoomed.dy + zoomed.dh >= 1440);

  // Portrait source image into 2560x1440 expands width to 2560 and overflows height
  const portrait = computeCoverTransform(1000, 1500, 2560, 1440, 1, 0, 0);
  assert.equal(Math.round(portrait.dw), 2560);
  assert.ok(portrait.dh > 1440);
});

test('computeTypographyMetrics adapts font size for long handles and alignment', () => {
  const zones = getYouTubeSafeZones(2560, 1440);
  const standard = computeTypographyMetrics('@MaCo_original', 'center', zones.safe);
  const longHandle = computeTypographyMetrics('@MaCo_original_anime_clips_hd', 'center', zones.safe);
  const leftAligned = computeTypographyMetrics('@MaCo_original', 'left', zones.safe);

  assert.equal(standard.handleFontSize, 118);
  assert.equal(standard.textAlign, 'center');
  assert.equal(standard.anchorX, 1280);

  assert.ok(longHandle.handleFontSize < standard.handleFontSize);
  assert.ok(longHandle.handleFontSize >= 64);

  assert.equal(leftAligned.textAlign, 'left');
  assert.ok(leftAligned.anchorX > zones.safe.x);
});

test('validateBannerInputs flags empty handle and overlong text', () => {
  const valid = validateBannerInputs('@MaCo_original', 'ANIME CLIPS · SAKUGA');
  assert.equal(valid.valid, true);
  assert.equal(valid.handleError, null);

  const emptyHandle = validateBannerInputs('   ', 'ANIME CLIPS');
  assert.equal(emptyHandle.valid, false);
  assert.ok(emptyHandle.handleError !== null);

  const longTagline = validateBannerInputs('@MaCo_original', 'A'.repeat(70));
  assert.equal(longTagline.valid, false);
  assert.ok(longTagline.taglineError !== null);
});

test('sanitizeExportFilename formats handles cleanly for PNG downloads', () => {
  assert.equal(
    sanitizeExportFilename('@MaCo_original', 'youtube_banner_2560x1440'),
    'MaCo_original_youtube_banner_2560x1440.png'
  );
  assert.equal(
    sanitizeExportFilename('  @MaCo Original! ', 'desktop_2560x423'),
    'MaCo_Original_desktop_2560x423.png'
  );
  assert.equal(
    sanitizeExportFilename('@@@', 'youtube_banner_2560x1440'),
    'youtube_channel_youtube_banner_2560x1440.png'
  );
});

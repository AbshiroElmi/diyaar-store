#!/usr/bin/env bash
# Renders every store screenshot + graphic with headless Chrome.
# Usage: bash store/source/render.sh            (all)
#        bash store/source/render.sh ios-phone  (only kinds whose folder matches)
#        bash store/source/render.sh graphics   (icons, feature graphic, headers)
set -euo pipefail
cd "$(dirname "$0")"
SRC="$PWD"
OUT="$SRC/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
FILTER="${1:-}"

shoot() { # url width height outfile
  mkdir -p "$(dirname "$4")"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --allow-file-access-from-files --virtual-time-budget=4000 \
    --window-size="$2,$3" --screenshot="$4" "$1" >/dev/null 2>&1
  flatten "$4"
  echo "  ✓ ${4#$OUT/}  ($2×$3)"
}

# Apple rejects icons/screenshots with an alpha channel. Chrome's screenshots are normally
# opaque already; if one ever isn't, round-trip it through BMP with macOS sips to drop alpha.
flatten() {
  if command -v sips >/dev/null && sips -g hasAlpha "$1" 2>/dev/null | grep -q 'hasAlpha: yes'; then
    local tmp="${1%.png}.tmp.bmp"
    sips -s format bmp "$1" --out "$tmp" >/dev/null && sips -s format png "$tmp" --out "$1" >/dev/null && rm -f "$tmp"
  fi
}

SLUGS=(_ your-store accept-orders kitchen-to-door menu earnings reviews hours-team)

# folder | kind | width | height
TARGETS=(
  "screenshots/ios/iPhone 6.9in_1320x2868|ios-phone|1320|2868"
  "screenshots/ios/iPhone 6.5in_1284x2778|ios-phone|1284|2778"
  "screenshots/ios/iPhone with Dynamic Island (medium display)_1206x2622|ios-phone|1206|2622"
  "screenshots/ios/iPad 13in display_2064x2752|ios-tablet|2064|2752"
  "screenshots/ios/iPhone Duo_2007x2853|ios-duo|2007|2853"
  "screenshots/android/phone_1080x1920|android-phone|1080|1920"
  "screenshots/android/tablet-7in_1080x1920|android-tablet|1080|1920"
  "screenshots/android/tablet-10in_1440x2560|android-tablet|1440|2560"
)

for t in "${TARGETS[@]}"; do
  IFS='|' read -r dir kind w h <<<"$t"
  [[ -n "$FILTER" && "$dir" != *"$FILTER"* && "$kind" != "$FILTER" ]] && continue
  echo "→ $dir"
  for n in 1 2 3 4 5 6 7; do
    shoot "file://$SRC/shot.html?kind=$kind&shot=$n&w=$w&h=$h" "$w" "$h" \
      "$OUT/$dir/0$n-${SLUGS[$n]}.png"
  done
done

if [[ -z "$FILTER" || "$FILTER" == "graphics" ]]; then
  echo "→ graphics"
  shoot "file://$SRC/graphic.html?g=feature&w=1024&h=500" 1024 500 "$OUT/graphics/android/feature-graphic_1024x500.png"
  shoot "file://$SRC/graphic.html?g=icon&w=512&h=512" 512 512 "$OUT/graphics/android/play-icon_512x512.png"
  shoot "file://$SRC/graphic.html?g=icon&w=1024&h=1024" 1024 1024 "$OUT/graphics/ios/app-store-icon_1024x1024.png"
  shoot "file://$SRC/graphic.html?g=header&w=3840&h=1646" 3840 1646 "$OUT/graphics/ios/Header_3840x1646.png"
  shoot "file://$SRC/graphic.html?g=header&w=5244&h=2950" 5244 2950 "$OUT/graphics/ios/Header_5244x2950.png"
  shoot "file://$SRC/graphic.html?g=header&w=3840&h=2560" 3840 2560 "$OUT/graphics/ios/Search-Results_3840x2560.png"
fi
echo "done"

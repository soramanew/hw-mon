#!/bin/fish

cd (dirname (status filename)) || exit 1

set -q XDG_RUNTIME_DIR && set bundle_dir $XDG_RUNTIME_DIR || set bundle_dir /tmp

./node_modules/.bin/esbuild app.tsx --bundle --outfile=$bundle_dir/hw-mon.js \
    --external:console --external:system --external:cairo --external:gettext --external:'file://*' --external:'gi://*' --external:'resource://*' \
    --define:SRC=\"(pwd)\" --format=esm --platform=neutral

gjs -m $bundle_dir/hw-mon.js

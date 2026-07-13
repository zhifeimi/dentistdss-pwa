#!/bin/sh
set -eu

DENO_VERSION="v2.9.2"
DENO_ARCHIVE="deno-x86_64-unknown-linux-gnu.zip"
DENO_SHA256="934d1bd5cb09eaed7f2e4a4fc58208d04a3c5c0fcde9f319d93d735265c67a4a"
DENO_INSTALL="${DENO_INSTALL:-$PWD/.deno}"
DOWNLOAD_URL="https://github.com/denoland/deno/releases/download/${DENO_VERSION}/${DENO_ARCHIVE}"

if [ "$(uname -s)" != "Linux" ] || [ "$(uname -m)" != "x86_64" ]; then
  echo "This deployment installer supports Linux x86_64 only." >&2
  exit 1
fi

mkdir -p "$DENO_INSTALL/bin"
TEMP_DIRECTORY="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIRECTORY"' EXIT HUP INT TERM

curl --proto '=https' --tlsv1.2 --fail --silent --show-error --location \
  "$DOWNLOAD_URL" --output "$TEMP_DIRECTORY/$DENO_ARCHIVE"

ACTUAL_SHA256="$(sha256sum "$TEMP_DIRECTORY/$DENO_ARCHIVE" | cut -d ' ' -f 1)"
if [ "$ACTUAL_SHA256" != "$DENO_SHA256" ]; then
  echo "Deno archive checksum verification failed." >&2
  exit 1
fi

unzip -q "$TEMP_DIRECTORY/$DENO_ARCHIVE" -d "$TEMP_DIRECTORY"
install -m 0755 "$TEMP_DIRECTORY/deno" "$DENO_INSTALL/bin/deno"
"$DENO_INSTALL/bin/deno" --version

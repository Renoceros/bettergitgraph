#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev.sh — BetterGitGraph dev container helper
#
# Usage:
#   ./dev.sh              # open interactive shell in the container
#   ./dev.sh build        # (re)build the container image
#   ./dev.sh run <cmd>    # run a one-off command and exit
#   ./dev.sh test         # run unit tests
#   ./dev.sh lint         # run lint + type-check
#   ./dev.sh compile      # build the extension host
#   ./dev.sh stop         # stop and remove the container
#   ./dev.sh reset        # remove image + volumes (full clean slate)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

COMPOSE="docker compose"   # Docker Compose v2 plugin (docker compose, not docker-compose)
SERVICE="dev"

# Detect host UID/GID so files aren't owned by root on the host
export DOCKER_UID=$(id -u)
export DOCKER_GID=$(id -g)

cmd="${1:-shell}"

case "$cmd" in
  build)
    echo "🔨 Building dev container image…"
    $COMPOSE build --no-cache
    echo "✅ Image built: bettergitgraph-dev:latest"
    ;;

  shell|"")
    echo "🐳 Opening shell in dev container…"
    $COMPOSE run --rm "$SERVICE"
    ;;

  run)
    shift
    echo "🐳 Running in container: $*"
    $COMPOSE run --rm "$SERVICE" "$@"
    ;;

  test)
    echo "🧪 Running unit tests…"
    $COMPOSE run --rm "$SERVICE" npm run test:unit
    ;;

  lint)
    echo "🔍 Running lint + type-check…"
    $COMPOSE run --rm "$SERVICE" bash -c "npm run check-types && npm run lint"
    ;;

  compile)
    echo "⚙️  Compiling extension host…"
    $COMPOSE run --rm "$SERVICE" node esbuild.js --production
    ;;

  stop)
    echo "🛑 Stopping container…"
    $COMPOSE down
    ;;

  reset)
    echo "🗑️  Removing container, image, and volumes…"
    $COMPOSE down --rmi local --volumes --remove-orphans
    echo "✅ Clean slate. Run './dev.sh build' to start fresh."
    ;;

  *)
    echo "Unknown command: $cmd"
    echo "Usage: ./dev.sh [build|shell|run <cmd>|test|lint|compile|stop|reset]"
    exit 1
    ;;
esac

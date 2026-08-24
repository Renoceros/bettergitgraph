# ─── BetterGitGraph Dev Container ─────────────────────────────────────────────
#
# A fully-equipped dev environment for the bettergitgraph extension.
# Only the project directory is mounted — the host filesystem is otherwise
# inaccessible to whatever runs inside this container.
#
# Build:  docker compose build
# Run:    docker compose run --rm dev
# ──────────────────────────────────────────────────────────────────────────────

FROM node:20-bookworm-slim

# ── Labels ─────────────────────────────────────────────────────────────────────
LABEL org.opencontainers.image.title="bettergitgraph-dev"
LABEL org.opencontainers.image.description="Dev container for BetterGitGraph VS Code extension"

# ── System packages ────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    git-lfs \
    curl \
    wget \
    unzip \
    ca-certificates \
    jq \
    ripgrep \
    fd-find \
    tree \
    vim \
    less \
    bash-completion \
    openssh-client \
    gnupg \
    procps \
    && ln -sf $(which fdfind) /usr/local/bin/fd \
    && rm -rf /var/lib/apt/lists/*

# ── GitHub CLI (gh) ────────────────────────────────────────────────────────────
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update \
    && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# ── Node global tools ──────────────────────────────────────────────────────────
RUN npm install -g \
    typescript \
    ts-node \
    yo \
    generator-code \
    @vscode/vsce \
    npm-run-all \
    vitest \
    && npm cache clean --force

# ── Non-root user: "dev" ───────────────────────────────────────────────────────
# Running as root inside containers is bad practice.
# The "dev" user owns /workspace — the only mounted directory.
ARG UID=1000
ARG GID=1000
RUN groupadd -g ${GID} dev && \
    useradd -m -u ${UID} -g dev -s /bin/bash dev

# ── Workspace ──────────────────────────────────────────────────────────────────
# This is the ONLY directory that will be bind-mounted from the host.
# Nothing outside /workspace is accessible.
WORKDIR /workspace
RUN chown dev:dev /workspace

# ── Git config defaults ────────────────────────────────────────────────────────
RUN git config --system core.autocrlf false \
    && git config --system init.defaultBranch main

# ── Shell enhancements ─────────────────────────────────────────────────────────
COPY docker/bashrc /home/dev/.bashrc_extra
RUN echo 'source /home/dev/.bashrc_extra' >> /home/dev/.bashrc \
    && chown dev:dev /home/dev/.bashrc_extra

USER dev

# ── Default command ────────────────────────────────────────────────────────────
# Drops you into an interactive bash shell in /workspace (the project dir).
CMD ["/bin/bash"]
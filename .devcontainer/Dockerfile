# syntax=docker/dockerfile:1

FROM ghcr.io/zizmorcore/zizmor:1.30.1@sha256:a2eb396d886c053073405c7a980f2139ba2248ec172243cfa3841e57196e8101 AS zizmor

FROM mcr.microsoft.com/devcontainers/javascript-node:5-26-bookworm@sha256:f052b166a5acd0424f6213921295629efb5ee07d9ab026b7d6f4418f927730d7

COPY --from=zizmor /usr/bin/zizmor /usr/local/bin/zizmor

RUN zizmor --version

USER node

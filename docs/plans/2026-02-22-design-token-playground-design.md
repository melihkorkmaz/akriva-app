# Design Token Playground — Design

## Overview

A single-file HTML playground for live-tweaking Akriva's CSS design tokens with a mini dashboard preview and token swatches. Exports CSS variables or Tailwind @theme blocks.

## Layout

Two-panel: left controls (~300px), right preview (flexible). Preview has mini dashboard on top and collapsible token swatches grid below.

## Control Groups

| Group | Controls |
|---|---|
| Colors — Surfaces | Background, Card, Popover — color pickers |
| Colors — Brand | Primary, Destructive — color pickers |
| Colors — Text | Foreground, Muted Foreground — color pickers |
| Colors — Borders | Border, Input, Ring — color pickers |
| Colors — Sidebar | Sidebar bg, Sidebar foreground, Sidebar accent — color pickers |
| Typography | Font family dropdown (Inter, System, Mono) |
| Radius | Base radius slider (0–16px) |
| Shadows | Shadow intensity slider (subtle → strong) |

## Mini Dashboard Preview

Compact fake Akriva page: dark sidebar with nav + avatar, page header with breadcrumb, Card with form fields and buttons, Badge, Alert, Progress bar, Separator. All rendered with live CSS variables.

## Token Swatches (collapsible)

Color swatches grid, shadow scale boxes, radius scale boxes, typography hierarchy samples.

## Presets

Akriva Default, Ocean, Forest, Sunset, Monochrome.

## Output

Copy CSS (`:root {}` block) and Copy Tailwind (`@theme inline {}` block) buttons. Light/dark mode toggle.

## Out of Scope

No saving presets, no import, no animated transitions.

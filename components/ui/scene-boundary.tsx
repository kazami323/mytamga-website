"use client";

import { Component, type ReactNode } from "react";

interface SceneBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: () => void;
}

interface SceneBoundaryState {
  hasError: boolean;
}

/**
 * The Spline scene is fetched from a third-party CDN. Without a boundary a
 * failed fetch surfaces as a render-time throw and React tears down the whole
 * tree — header, hero and preloader with it, leaving a blank page and a scroll
 * lock nothing is left running to release.
 */
export class SceneBoundary extends Component<
  SceneBoundaryProps,
  SceneBoundaryState
> {
  state: SceneBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SceneBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }

    return this.props.children;
  }
}

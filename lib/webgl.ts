/**
 * Explicitly releases the WebGL context behind each canvas.
 *
 * Library dispose() methods — Paper Shaders' ShaderMount, the Spline runtime —
 * free what lives inside a context but leave the context itself to the garbage
 * collector. Until it runs, the context stays live. A language switch remounts
 * the whole page, so eight contexts piled up per switch until the browser hit
 * its limit of sixteen and began killing the oldest.
 *
 * getContext() on a canvas that already has a context returns that same
 * context, so this reaches it without touching library internals. Call it only
 * on canvases known to hold WebGL: on a bare canvas it would create a context.
 */
export function releaseWebGL(canvases: Iterable<HTMLCanvasElement>) {
  for (const canvas of canvases) {
    const gl =
      (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ??
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

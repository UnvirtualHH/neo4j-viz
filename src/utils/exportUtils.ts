import { Renderer, Container } from "pixi.js";

/**
 * Exports a PixiJS container (the graph) as a PNG image and triggers download.
 * @param renderer The PixiJS renderer
 * @param graphContainer The main graph container (excluding minimap)
 * @param filename The download filename
 */
export function exportGraphAsPNG(
  renderer: Renderer,
  stage: Container,
  minimap?: Container,
  filename = "graph.png"
) {
  // Hide minimap if present
  const wasVisible = !!(minimap && minimap.visible);
  if (minimap) minimap.visible = false;

  const extract = (renderer as any).extract;
  if (!extract) {
    alert(
      "PixiJS extract is not available on the renderer. Please ensure you are using pixiApp.renderer and PixiJS v8+."
    );
    if (minimap) minimap.visible = !!wasVisible;
    return;
  }
  renderer.render(stage);
  const canvas = extract.canvas(stage);
  canvas.toBlob((blob: Blob | null) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (minimap) minimap.visible = !!wasVisible;
  }, "image/png");
  // Restore minimap in case toBlob is async
  if (minimap) minimap.visible = !!wasVisible;
}

// If you see an error about extract, try adding: import '@pixi/extract'; at your main entry point.

/**
 * Exports a PixiJS container as SVG and triggers download. Requires all graphics to be vector.
 * PixiJS does not natively support SVG export for arbitrary containers! You need to use a plugin or custom serialization.
 * @param graphContainer The main graph container
 * @param filename The download filename
 */
export function exportGraphAsSVG(graphContainer: any, filename = "graph.svg") {
  const nodes =
    typeof graphContainer.getNodes === "function"
      ? graphContainer.getNodes()
      : [];
  const edges =
    typeof graphContainer.getEdges === "function"
      ? graphContainer.getEdges()
      : [];
  if (!nodes.length) {
    alert("No nodes to export.");
    return;
  }

  // Compute bounds with padding
  const xs = nodes.map((n: any) => n.position.x);
  const ys = nodes.map((n: any) => n.position.y);
  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  const padding = 40;
  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;
  const width = maxX - minX;
  const height = maxY - minY;

  // SVG header
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">\n`;

  // Add background rectangle
  svg += `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#888888" />\n`;

  // Draw edges
  for (const edge of edges) {
    const start = edge.startNode.position;
    const end = edge.endNode.position;
    const color = edge.color
      ? "#" + edge.color.toString(16).padStart(6, "0")
      : "#bbb";
    const thickness = edge.thickness ?? 2;
    svg += `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="${color}" stroke-width="${thickness}" />\n`;

    // Edge label/caption
    let labelValue = "";
    if (edge.caption && edge.data && edge.data[edge.caption] != null) {
      labelValue = String(edge.data[edge.caption]);
    } else if (edge.label) {
      labelValue = edge.label;
    }
    if (labelValue) {
      const mx = (start.x + end.x) / 2;
      const my = (start.y + end.y) / 2;
      svg += `<text x="${mx}" y="${
        my - 6
      }" font-family="Arial, sans-serif" font-size="12" fill="#fff" text-anchor="middle" alignment-baseline="baseline">${escapeXml(
        labelValue
      )}</text>\n`;
    }
  }

  // Draw nodes
  for (const node of nodes) {
    const color = "#" + node.color.toString(16).padStart(6, "0");
    svg += `<circle cx="${node.position.x}" cy="${node.position.y}" r="${node.radius}" fill="${color}" />\n`;
    if (node.label) {
      svg += `<text x="${node.position.x}" y="${
        node.position.y + 4
      }" font-family="Arial, sans-serif" font-size="${Math.max(
        10,
        Math.round(node.radius * 1.2)
      )}" fill="#fff" text-anchor="middle" alignment-baseline="middle">${escapeXml(
        node.label
      )}</text>\n`;
    }
  }

  svg += "</svg>";

  // Download
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper to escape XML special chars
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&"']/g, function (c) {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return c;
    }
  });
}

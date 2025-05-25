import { LayoutStrategy } from "./layoutstrategy";
import Node from "../node";
import Edge from "../edge";

export class RadialLayout implements LayoutStrategy {
  private baseRadius = 100;
  private radiusStep = 150;
  private maxAngleStep = Math.PI / 6;

  constructor(private rootId?: string) {}

  apply(nodes: Node[], edges: Edge<any>[]) {
    if (nodes.length === 0) return;

    const root = this.rootId
      ? nodes.find((n) => n.id === this.rootId) || nodes[0]
      : nodes[0];

    root.position.x = 0;
    root.position.y = 0;

    nodes.forEach((node) => {
      if (
        !node.label &&
        (node as any).labels &&
        (node as any).labels.length > 0
      ) {
        node.label = (node as any).labels[0];
      }
    });

    const levels = new Map<Node, number>();
    const parents = new Map<Node, Node>();
    levels.set(root, 0);

    const visited = new Set<Node>();
    visited.add(root);
    const queue: Node[] = [root];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = levels.get(current)!;

      const neighbors = edges
        .filter((e) => e.startNode === current || e.endNode === current)
        .map((e) => (e.startNode === current ? e.endNode : e.startNode));

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          levels.set(neighbor, currentLevel + 1);
          parents.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }

    const maxLevel = Math.max(...levels.values());
    for (let level = 1; level <= maxLevel; level++) {
      const levelNodes = nodes.filter((n) => levels.get(n) === level);
      if (levelNodes.length === 0) continue;

      const radius = this.baseRadius + level * (this.radiusStep + level * 5);

      const sorted = levelNodes.sort((a, b) => {
        const pa = parents.get(a);
        const pb = parents.get(b);
        const angleA = pa ? Math.atan2(pa.position.y, pa.position.x) : 0;
        const angleB = pb ? Math.atan2(pb.position.y, pb.position.x) : 0;
        return angleA - angleB;
      });

      const angleStep = Math.min(
        (2 * Math.PI) / sorted.length,
        this.maxAngleStep
      );
      const angleOffset = (Math.PI - angleStep * sorted.length) / 2;

      sorted.forEach((node, i) => {
        const angle = angleOffset + i * angleStep;
        node.position.x = radius * Math.cos(angle);
        node.position.y = radius * Math.sin(angle);
      });
    }

    const unconnectedNodes = nodes.filter((n) => !levels.has(n));
    const outerRadius = this.baseRadius + (maxLevel + 1) * this.radiusStep;
    const outerAngleStep = (2 * Math.PI) / unconnectedNodes.length;

    unconnectedNodes.forEach((node, i) => {
      const angle = i * outerAngleStep;
      node.position.x = outerRadius * Math.cos(angle);
      node.position.y = outerRadius * Math.sin(angle);
    });
  }
}

import { LayoutStrategy } from "./layoutstrategy";
import Node, { NodeId } from "../node";
import Edge from "../edge";

export class TreeLayout implements LayoutStrategy {
  private horizontalSpacing = 120;
  private verticalSpacing = 100;

  apply(nodes: Node[], edges: Edge<any>[]) {
    const nodeMap = new Map<NodeId, Node>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const childrenMap = new Map<NodeId, Node[]>();
    edges.forEach((e) => {
      const from = e.startNode.id;
      const to = e.endNode;

      if (!childrenMap.has(from)) childrenMap.set(from, []);
      childrenMap.get(from)!.push(to);
    });

    const allTargets = new Set(edges.map((e) => e.endNode.id));
    let roots = nodes.filter((n) => !allTargets.has(n.id));

    if (roots.length === 0 && nodes.length > 0) {
      roots = [nodes[0]];
    }

    const visited = new Set<NodeId>();
    let currentX = 0;

    const placeSubtree = (node: Node, depth: number) => {
      if (visited.has(node.id)) return;
      visited.add(node.id);

      const children = childrenMap.get(node.id) || [];
      const childPositions: number[] = [];

      for (const child of children) {
        placeSubtree(child, depth + 1);
        childPositions.push(child.position.x);
      }

      const avgX =
        childPositions.length > 0
          ? childPositions.reduce((a, b) => a + b, 0) / childPositions.length
          : currentX;

      node.position.x = avgX;
      node.position.y = depth * this.verticalSpacing;

      if (childPositions.length === 0) {
        node.position.x = currentX;
        currentX += this.horizontalSpacing;
      }
    };

    roots.forEach((root) => placeSubtree(root, 0));
  }
}

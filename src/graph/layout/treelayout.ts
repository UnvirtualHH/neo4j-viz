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
    const parentSet = new Set<NodeId>();

    edges.forEach((e) => {
      const from = e.startNode.id;
      const to = e.endNode;

      if (!childrenMap.has(from)) childrenMap.set(from, []);
      childrenMap.get(from)!.push(to);
      parentSet.add(to.id);
    });

    let roots = nodes.filter((n) => !parentSet.has(n.id));
    if (roots.length === 0 && nodes.length > 0) {
      roots = [nodes[0]]; 
    }

    const visited = new Set<NodeId>();
    let currentX = 0;

    const placeSubtree = (node: Node, depth: number): number => {
      if (visited.has(node.id)) return node.position.x; 
      visited.add(node.id);

      const children = childrenMap.get(node.id) || [];
      const startX = currentX;

      if (children.length === 0) {
        node.position.x = currentX;
        node.position.y = depth * this.verticalSpacing;
        currentX += this.horizontalSpacing;
        return node.position.x;
      }

      const childXs: number[] = [];
      for (const child of children) {
        const childX = placeSubtree(child, depth + 1);
        childXs.push(childX);
      }

      const x = (Math.min(...childXs) + Math.max(...childXs)) / 2;
      node.position.x = x;
      node.position.y = depth * this.verticalSpacing;

      return x;
    };

    for (const root of roots) {
      const rootX = placeSubtree(root, 0);
      currentX = Math.max(currentX, rootX + this.horizontalSpacing);
    }

    nodes.forEach((node) => {
      if (
        !node.label &&
        (node as any).labels &&
        (node as any).labels.length > 0
      ) {
        node.label = (node as any).labels[0];
      }
    });
  }
}

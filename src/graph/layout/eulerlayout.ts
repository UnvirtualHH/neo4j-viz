import { LayoutStrategy } from "./layoutstrategy";
import Node from "../node";
import Edge from "../edge";

export class EulerGraphLayout implements LayoutStrategy {
  private repulsionStrength = 100000;
  private springLength = 120;
  private springStiffness = 0.1;

  apply(nodes: Node[], edges: Edge<any>[]) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        const dx = n2.position.x - n1.position.x;
        const dy = n2.position.y - n1.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const force = this.repulsionStrength / (dist * dist);
        const fx = force * (dx / dist);
        const fy = force * (dy / dist);

        n1.vx -= fx;
        n1.vy -= fy;
        n2.vx += fx;
        n2.vy += fy;
      }
    }

    edges.forEach((edge) => {
      const n1 = edge.startNode;
      const n2 = edge.endNode;
      const dx = n2.position.x - n1.position.x;
      const dy = n2.position.y - n1.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const displacement = dist - this.springLength;
      const force = this.springStiffness * displacement;
      const fx = force * (dx / dist);
      const fy = force * (dy / dist);

      n1.vx += fx;
      n1.vy += fy;
      n2.vx -= fx;
      n2.vy -= fy;
    });
  }
}

import { LayoutStrategy } from "./layoutstrategy";
import Node from "../node";
import Edge from "../edge";

export class ForceGraphLayout implements LayoutStrategy {
  private gravityConstant = 0.05;
  private repulsionConstant = 3000;
  private springLength = 120;
  private springStiffness = 0.1;

  apply(nodes: Node[], edges: Edge<any>[]) {
    nodes.forEach((node) => {
      node.vx += -node.position.x * this.gravityConstant;
      node.vy += -node.position.y * this.gravityConstant;
    });

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].position.x - nodes[i].position.x;
        const dy = nodes[j].position.y - nodes[i].position.y;
        const distSq = dx * dx + dy * dy + 0.01;
        const force = this.repulsionConstant / distSq;
        const fx = dx * force;
        const fy = dy * force;

        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
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

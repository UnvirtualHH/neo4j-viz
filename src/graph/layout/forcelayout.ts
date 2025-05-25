import { LayoutStrategy } from "./layoutstrategy";
import Node from "../node";
import Edge from "../edge";

export class ForceGraphLayout implements LayoutStrategy {
  private gravityConstant = 0.05;
  private repulsionConstant = 2000;
  private springLength = 200;
  private springStiffness = 0.1;
  private damping = 0.85;
  private minDistance = 50;
  private clusteringForce = 0.01;

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
        const dist = Math.sqrt(distSq);

        const force = this.repulsionConstant / distSq;
        const fx = dx * force;
        const fy = dy * force;

        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;

        if (dist < this.minDistance) {
          const adjust = (this.minDistance - dist) / dist;
          const fxAdjust = dx * adjust;
          const fyAdjust = dy * adjust;

          nodes[i].vx -= fxAdjust;
          nodes[i].vy -= fyAdjust;
          nodes[j].vx += fxAdjust;
          nodes[j].vy += fyAdjust;
        }

        if (nodes[i].label !== undefined && nodes[i].label === nodes[j].label) {
          const clusterFx = dx * this.clusteringForce;
          const clusterFy = dy * this.clusteringForce;

          nodes[i].vx += clusterFx;
          nodes[i].vy += clusterFy;
          nodes[j].vx -= clusterFx;
          nodes[j].vy -= clusterFy;
        }
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

    nodes.forEach((node) => {
      node.vx *= this.damping;
      node.vy *= this.damping;
      node.position.x += node.vx;
      node.position.y += node.vy;
    });
  }
}

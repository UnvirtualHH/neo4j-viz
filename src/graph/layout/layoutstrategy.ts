import Node from "../node";
import Edge from "../edge";

export interface LayoutStrategy {
  apply(nodes: Node[], edges: Edge<any>[]): void;
}

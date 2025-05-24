import {
  Type,
  Check,
  Hash,
  Divide,
  Calendar,
  Clock,
  Timer,
  MapPin,
  List,
  LayoutList,
} from "lucide-solid";
import type { JSX } from "solid-js";
import { Neo4jValueType } from "../../types/neo4jvalues";

export const neo4jTypeIcons: Record<
  Neo4jValueType | "id" | "elementId" | "any",
  () => JSX.Element
> = {
  string: () => <Type size={16} />,
  boolean: () => <Check size={16} />,
  integer: () => <Hash size={16} />,
  float: () => <Divide size={16} />,
  date: () => <Calendar size={16} />,
  time: () => <Clock size={16} />,
  localTime: () => <Clock size={16} />,
  dateTime: () => <Clock size={16} />,
  localDateTime: () => <Clock size={16} />,
  duration: () => <Timer size={16} />,
  point: () => <MapPin size={16} />,
  map: () => <LayoutList size={16} />,
  list: () => <List size={16} />,
  id: () => <Hash size={16} />,
  elementId: () => <Hash size={16} />,
  null: () => <Type size={16} />,
  any: () => <Type size={16} />,
};

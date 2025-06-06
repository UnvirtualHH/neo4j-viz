import { ZoomIn, ZoomOut } from "lucide-solid";
import { Accessor, Component } from "solid-js";
import { useAppContext } from "../../AppContext";

type ZoomControlProps = {
  zoomLevel: Accessor<number>;
  minZoom: number;
  maxZoom: number;
  onZoomChange: (zoom: number) => void;
};

const ZoomControl: Component<ZoomControlProps> = ({
  zoomLevel,
  minZoom,
  maxZoom,
  onZoomChange,
}) => {
  const { t } = useAppContext();
  const handleClick = (e: MouseEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const ratio = 1 - clickY / rect.height;
    const newZoom = minZoom + ratio * (maxZoom - minZoom);
    onZoomChange(parseFloat(newZoom.toFixed(2)));
  };

  return (
    <div class="glass p-3 rounded-xl shadow-lg flex flex-col items-center gap-2">
      <button
        class="text-white text-2xl leading-none w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition"
        onClick={() => onZoomChange(Math.min(zoomLevel() * 1.2, maxZoom))}
        aria-label={t("zoom.in")}
      >
        <ZoomIn class="text-white w-5 h-5" />
      </button>

      <div
        class="relative h-32 w-3 bg-gray-700 rounded-full cursor-pointer"
        onClick={handleClick}
      >
        <div
          class="absolute left-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-md border border-white transition-transform"
          style={{
            bottom: `${((zoomLevel() - minZoom) / (maxZoom - minZoom)) * 100}%`,
            transform: "translate(-50%, 50%)",
          }}
        />
      </div>

      <button
        class="text-white text-2xl leading-none w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition"
        onClick={() => onZoomChange(Math.max(zoomLevel() / 1.2, minZoom))}
        aria-label={t("zoom.out")}
      >
        <ZoomOut class="text-white w-5 h-5" />
      </button>
    </div>
  );
};

export default ZoomControl;

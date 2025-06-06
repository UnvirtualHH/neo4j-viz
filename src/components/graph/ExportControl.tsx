import { Component } from "solid-js";
import { ImageIcon, FileImageIcon } from "lucide-solid";
import { useAppContext } from "../../AppContext";
import { exportGraphAsPNG, exportGraphAsSVG } from "../../utils/exportUtils";

type ExportControlProps = {
  getPixiApp?: () => any;
  getGraph?: () => any;
  getMinimap?: () => any;
};

const ExportControl: Component<ExportControlProps> = ({
  getPixiApp,
  getGraph,
  getMinimap,
}) => {
  const { t } = useAppContext();

  const handleExportPNG = () => {
    if (
      getPixiApp &&
      getPixiApp()?.renderer &&
      getPixiApp()?.stage &&
      getMinimap &&
      getMinimap()?.container
    ) {
      exportGraphAsPNG(
        getPixiApp().renderer,
        getPixiApp().stage,
        getMinimap().container
      );
    }
  };

  const handleExportSVG = () => {
    if (getGraph) {
      exportGraphAsSVG(getGraph());
    }
  };

  return (
    <div class="glass p-3 rounded-xl shadow-lg flex flex-col items-center gap-2 mb-3">
      <button
        class="text-white text-2xl leading-none w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition"
        title={t("export.png")}
        aria-label={t("export.png")}
        onClick={handleExportPNG}
      >
        <ImageIcon class="w-5 h-5" />
      </button>
      <button
        class="text-white text-2xl leading-none w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition"
        title={t("export.svg")}
        aria-label={t("export.svg")}
        onClick={handleExportSVG}
      >
        <FileImageIcon class="w-5 h-5" />
      </button>
    </div>
  );
};

export default ExportControl;

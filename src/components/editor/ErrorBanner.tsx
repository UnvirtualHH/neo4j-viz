import { Component } from "solid-js";
import { AlertTriangle } from "lucide-solid";

type ErrorBannerProps = {
  message: string;
};

const ErrorBanner: Component<ErrorBannerProps> = (props) => {
  return (
    <div class="editor-error bg-red-100 text-red-800 p-2 text-sm border border-red-400 rounded mt-2 flex items-start gap-2">
      <AlertTriangle size={16} class="mt-0.5" />
      <span>{props.message}</span>
    </div>
  );
};

export default ErrorBanner;

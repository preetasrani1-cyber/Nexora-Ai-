export default function Logo({ size = "md" }) {
  const textSize = size === "lg" ? "text-2xl" : "text-sm";
  const markSize = size === "lg" ? "text-2xl" : "text-base";

  return (
    <div className="flex items-center gap-2 select-none">
      <span className={`${markSize} text-nebula-400`}>✦</span>
      <span className={`${textSize} font-semibold tracking-tight text-starlight-50`}>
        Nexora AI
      </span>
    </div>
  );
}

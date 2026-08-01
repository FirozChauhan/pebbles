import DotField from "../../@/components/DotField.jsx";
import { type JSX } from "react";

const DotBg = (): JSX.Element => {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        <DotField
          dotRadius={2}
          dotSpacing={14}
          cursorRadius={850}
          cursorForce={0.61}
          bulgeOnly
          bulgeStrength={126}
          glowRadius={50}
          sparkle
          waveAmplitude={1}
          gradientFrom="#10B981"
          gradientTo="rgba(180, 151, 207, 0.25)"
          glowColor="#120F17"
        />
      </div>
    </div>
  );
};

export default DotBg;

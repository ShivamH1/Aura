"use client";

import type { SceneConfig } from "@/lib/types";
import SkyGradient from "@/components/layers/SkyGradient";
import CelestialLayer from "@/components/layers/CelestialLayer";
import CloudLayer from "@/components/layers/CloudLayer";
import FogLayer from "@/components/layers/FogLayer";
import PrecipitationCanvas from "@/components/layers/PrecipitationCanvas";
import LightningLayer from "@/components/layers/LightningLayer";

interface AtmosphereSceneProps {
  scene: SceneConfig;
  reducedMotion: boolean;
}

export default function AtmosphereScene({ scene, reducedMotion }: AtmosphereSceneProps) {
  const rm = reducedMotion;

  return (
    <div aria-hidden className="fixed inset-0 -z-20 pointer-events-none">
      {/* 1. Sky gradient — always present. */}
      <SkyGradient palette={scene.palette} reducedMotion={rm} />

      {/* 2. Sun / moon / stars. */}
      {(scene.showCelestial || scene.isNight) && (
        <CelestialLayer scene={scene} reducedMotion={rm} />
      )}

      {/* 3. Drifting clouds. */}
      {scene.showClouds && (
        <CloudLayer density={scene.cloudDensity} reducedMotion={rm} />
      )}

      {/* 4. Fog bands. */}
      {scene.showFog && <FogLayer intensity={scene.intensity} reducedMotion={rm} />}

      {/* 5. Rain / snow particles — remount cleanly on kind change. */}
      {scene.particle !== null && (
        <PrecipitationCanvas
          key={scene.particle}
          kind={scene.particle}
          intensity={scene.intensity}
          reducedMotion={rm}
        />
      )}

      {/* 6. Lightning flashes. */}
      <LightningLayer active={scene.showLightning} reducedMotion={rm} />

      {/* 7. Legibility vignette / scrim. */}
      <div
        className="absolute inset-0 -z-4"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.28) 100%)",
        }}
      />
    </div>
  );
}

import { useMemo } from 'react';

/**
 * Renders seasonal visual effects based on the active season.
 * Winter: multi-layer snow, icicles, ice sparkles, frost vignette, aurora glow.
 */
export default function SeasonalEffects({ season }) {
  const snow = useMemo(() => {
    if (season !== 'winter') return { bg: [], mid: [], fg: [] };

    // Background layer — tiny, slow, faint
    const bg = Array.from({ length: 60 }, (_, i) => ({
      id: `bg-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 18,
      duration: 18 + Math.random() * 22,
      size: 1 + Math.random() * 2,
      opacity: 0.08 + Math.random() * 0.15,
    }));

    // Midground layer — medium, moderate speed
    const mid = Array.from({ length: 50 }, (_, i) => ({
      id: `mid-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 14,
      duration: 10 + Math.random() * 14,
      size: 2.5 + Math.random() * 3,
      opacity: 0.15 + Math.random() * 0.25,
    }));

    // Foreground layer — large, fast, slightly blurred (close to camera)
    const fg = Array.from({ length: 40 }, (_, i) => ({
      id: `fg-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 6 + Math.random() * 8,
      size: 4 + Math.random() * 7,
      opacity: 0.25 + Math.random() * 0.35,
      blur: 0.5 + Math.random() * 2,
    }));

    return { bg, mid, fg };
  }, [season]);

  const icicles = useMemo(() => {
    if (season !== 'winter') return [];
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: (i / 30) * 100 + (Math.random() - 0.5) * 3.5,
      width: 8 + Math.random() * 18,
      height: 22 + Math.random() * 70,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
    }));
  }, [season]);

  const sparkles = useMemo(() => {
    if (season !== 'winter') return [];
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: 8 + Math.random() * 84,
      delay: Math.random() * 8,
      duration: 2.5 + Math.random() * 3.5,
      size: 3 + Math.random() * 6,
    }));
  }, [season]);

  if (season !== 'winter') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Frozen aurora glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[1100px] rounded-full bg-blue-500/[0.07] blur-[150px]" />
      <div className="absolute top-10 left-5 h-[300px] w-[300px] rounded-full bg-cyan-300/[0.05] blur-[120px]" />
      <div className="absolute top-20 right-5 h-[350px] w-[350px] rounded-full bg-indigo-500/[0.05] blur-[130px]" />

      {/* Frost vignette around edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 45%, rgba(116,192,252,0.04) 82%, rgba(77,171,247,0.09) 100%)',
        }}
      />

      {/* Frost corner glows */}
      <div className="absolute top-0 left-0 h-48 w-48" style={{ background: 'radial-gradient(circle at top left, rgba(208,235,255,0.1), transparent 70%)' }} />
      <div className="absolute top-0 right-0 h-48 w-48" style={{ background: 'radial-gradient(circle at top right, rgba(208,235,255,0.1), transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 h-36 w-36" style={{ background: 'radial-gradient(circle at bottom left, rgba(165,216,255,0.07), transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 h-36 w-36" style={{ background: 'radial-gradient(circle at bottom right, rgba(165,216,255,0.07), transparent 70%)' }} />

      {/* Frosty mist at the bottom */}
      <div
        className="absolute bottom-0 inset-x-0 h-32"
        style={{ background: 'linear-gradient(to top, rgba(116,192,252,0.06), transparent)' }}
      />

      {/* Crystalline frost line at top */}
      <div
        className="absolute top-0 inset-x-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(208,235,255,0.3) 15%, rgba(165,216,255,0.6) 50%, rgba(208,235,255,0.3) 85%, transparent)',
          boxShadow: '0 0 10px rgba(116,192,252,0.4)',
        }}
      />

      {/* Icicles hanging from the top */}
      <div className="absolute top-0 inset-x-0">
        {icicles.map((ic) => (
          <div
            key={ic.id}
            className="absolute top-0 icicle"
            style={{
              left: `${ic.left}%`,
              width: `${ic.width}px`,
              height: `${ic.height}px`,
              animation: `icicle-shimmer ${ic.duration}s ease-in-out ${ic.delay}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Ice crystal sparkles */}
      {sparkles.map((sp) => (
        <div
          key={sp.id}
          className="absolute sparkle"
          style={{
            left: `${sp.left}%`,
            top: `${sp.top}%`,
            width: `${sp.size}px`,
            height: `${sp.size}px`,
            animation: `sparkle ${sp.duration}s ease-in-out ${sp.delay}s infinite`,
          }}
        />
      ))}

      {/* Snow — background layer */}
      {snow.bg.map((f) => (
        <div
          key={f.id}
          className="absolute rounded-full bg-white will-change-transform"
          style={{
            left: `${f.left}%`,
            top: '-10px',
            width: `${f.size}px`,
            height: `${f.size}px`,
            opacity: f.opacity,
            animation: `snowfall-bg ${f.duration}s linear ${f.delay}s infinite`,
          }}
        />
      ))}

      {/* Snow — midground layer */}
      {snow.mid.map((f) => (
        <div
          key={f.id}
          className="absolute rounded-full bg-white will-change-transform"
          style={{
            left: `${f.left}%`,
            top: '-10px',
            width: `${f.size}px`,
            height: `${f.size}px`,
            opacity: f.opacity,
            animation: `snowfall-mid ${f.duration}s linear ${f.delay}s infinite`,
          }}
        />
      ))}

      {/* Snow — foreground layer */}
      {snow.fg.map((f) => (
        <div
          key={f.id}
          className="absolute rounded-full bg-white will-change-transform"
          style={{
            left: `${f.left}%`,
            top: '-10px',
            width: `${f.size}px`,
            height: `${f.size}px`,
            opacity: f.opacity,
            filter: `blur(${f.blur}px)`,
            animation: `snowfall-fg ${f.duration}s linear ${f.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
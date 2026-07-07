/*!
 * sonics/react — tiny React bindings for sonics. React is a peer dependency.
 * License: MIT.
 */

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import sonics, {
  play,
  armAutoUnlock,
  setMuted,
  setVolume,
  type SoundInput,
  type PlayOptions,
} from "sonics";

export interface SonicsControls {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  toggle: () => void;
  volume: number;
  setVolume: (v: number) => void;
  play: (sound: SoundInput, opts?: PlayOptions) => void;
}

const SonicsContext = createContext<SonicsControls | null>(null);

const STORAGE_KEY = "sonics:prefs";

function loadPrefs(): { enabled?: boolean; volume?: number } {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export interface SonicsProviderProps {
  children?: ReactNode;
  /** Initial enabled state. Defaults to true unless the OS prefers reduced motion. */
  defaultEnabled?: boolean;
  /** Initial volume, 0..1. Default 1. */
  defaultVolume?: number;
}

/**
 * Optional provider. Gives descendants a shared enabled/volume state that
 * persists to localStorage, defaults to off when the OS prefers reduced
 * motion, and arms audio auto-unlock on the first gesture.
 */
export function SonicsProvider({ children, defaultEnabled, defaultVolume = 1 }: SonicsProviderProps) {
  const prefs = useMemo(() => (typeof window !== "undefined" ? loadPrefs() : {}), []);
  const prefersReduced =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const [enabled, setEnabledState] = useState<boolean>(
    prefs.enabled ?? defaultEnabled ?? !prefersReduced
  );
  const [volume, setVolumeState] = useState<number>(prefs.volume ?? defaultVolume);

  useEffect(() => {
    armAutoUnlock();
  }, []);

  useEffect(() => {
    setMuted(!enabled);
    setVolume(volume);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, volume }));
    } catch {
      /* storage unavailable */
    }
  }, [enabled, volume]);

  const value = useMemo<SonicsControls>(
    () => ({
      enabled,
      setEnabled: setEnabledState,
      toggle: () => setEnabledState((e) => !e),
      volume,
      setVolume: setVolumeState,
      play: (sound, opts) => {
        if (enabled) play(sound, opts);
      },
    }),
    [enabled, volume]
  );

  return createElement(SonicsContext.Provider, { value }, children);
}

/** Access the provider's controls. Falls back to a provider-less shim that
 *  always plays, so it's safe to call without a <SonicsProvider>. */
export function useSonics(): SonicsControls {
  const ctx = useContext(SonicsContext);
  if (ctx) return ctx;
  return {
    enabled: true,
    setEnabled: () => {},
    toggle: () => {},
    volume: 1,
    setVolume: () => {},
    play: (sound, opts) => play(sound, opts),
  };
}

/**
 * The main hook. Returns a stable trigger you can drop onto any handler.
 *
 *   const click = useSound("click");
 *   <button onClick={click}>Save</button>
 */
export function useSound(
  sound: SoundInput,
  opts?: PlayOptions
): (overrideOpts?: PlayOptions) => void {
  const { play: playScoped } = useSonics();
  const ref = useRef({ sound, opts });
  ref.current = { sound, opts };
  return useCallback(
    (overrideOpts?: PlayOptions) => {
      const { sound: s, opts: o } = ref.current;
      playScoped(s, overrideOpts ? { ...o, ...overrideOpts } : o);
    },
    [playScoped]
  );
}

export interface SonicsButtonProps {
  sound?: SoundInput;
  soundOpts?: PlayOptions;
  /** Which event fires the sound. Default "click". */
  on?: "click" | "pointerdown" | "hover";
  /** Element or component to render. Default "button". */
  as?: ElementType;
  onClick?: (e: unknown) => void;
  onPointerDown?: (e: unknown) => void;
  onPointerEnter?: (e: unknown) => void;
  children?: ReactNode;
  [prop: string]: unknown;
}

/** Drop-in button that plays a sound on click / pointerdown / hover. */
export function SonicsButton({
  sound = "click",
  soundOpts,
  on = "click",
  as = "button",
  onClick,
  onPointerDown,
  onPointerEnter,
  children,
  ...rest
}: SonicsButtonProps) {
  const trigger = useSound(sound, soundOpts);
  return createElement(
    as,
    {
      ...rest,
      onClick: (e: unknown) => {
        if (on === "click") trigger();
        onClick?.(e);
      },
      onPointerDown: (e: unknown) => {
        if (on === "pointerdown") trigger();
        onPointerDown?.(e);
      },
      onPointerEnter: (e: unknown) => {
        if (on === "hover") trigger();
        onPointerEnter?.(e);
      },
    },
    children
  );
}

export { sonics };
export default useSonics;

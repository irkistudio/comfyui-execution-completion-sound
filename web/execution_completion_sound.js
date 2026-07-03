import { api } from "../../scripts/api.js";
import { app } from "../../scripts/app.js";

const ENABLED_SETTING_ID = "Comfy.ExecutionCompletionSound.Enabled";
const VOLUME_SETTING_ID = "Comfy.ExecutionCompletionSound.Volume";
const TEST_SOUND_SETTING_ID = "Comfy.ExecutionCompletionSound.Test";
const MIN_PLAY_INTERVAL_MS = 700;
const COMPLETION_SOUND_URL = new URL("./assets/completion.mp3", import.meta.url).href;
const OPEN_LOCATION_ROUTE = "/execution-completion-sound/open-file-location";

let audioContext;
let audioBufferPromise;
let lastPlayedAt = 0;
let audioUnlockWarningShown = false;
const activePromptIds = new Set();

function getSettingValue(id, fallback) {
  try {
    return app.ui?.settings?.getSettingValue?.(id) ?? fallback;
  } catch {
    return fallback;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

function getAudioContext() {
  if (audioContext) {
    return audioContext;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  audioContext = new AudioContextClass();
  return audioContext;
}

function loadAudioBuffer() {
  const context = getAudioContext();
  if (!context) {
    return null;
  }

  if (!audioBufferPromise) {
    audioBufferPromise = fetch(COMPLETION_SOUND_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Sound file returned ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then((buffer) => context.decodeAudioData(buffer));
  }

  return audioBufferPromise;
}

function unlockAudio() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  context.resume().catch(() => {});
  loadAudioBuffer();
}

function installAudioUnlockHandlers() {
  const unlock = () => unlockAudio();
  const options = { capture: true, passive: true };

  window.addEventListener("pointerdown", unlock, options);
  window.addEventListener("keydown", unlock, options);
  window.addEventListener("touchstart", unlock, options);
}

async function playCompletionSound() {
  if (!getSettingValue(ENABLED_SETTING_ID, true)) {
    return;
  }

  const nowMs = performance.now();
  if (nowMs - lastPlayedAt < MIN_PLAY_INTERVAL_MS) {
    return;
  }
  lastPlayedAt = nowMs;

  const context = getAudioContext();
  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    await context.resume().catch(() => {});
  }

  if (context.state === "suspended") {
    if (!audioUnlockWarningShown) {
      audioUnlockWarningShown = true;
      showToast("warn", "Completion sound is waiting", "Click anywhere in ComfyUI once to enable browser audio.");
    }
    return;
  }

  try {
    const buffer = await loadAudioBuffer();
    if (!buffer) {
      return;
    }

    const source = context.createBufferSource();
    const gain = context.createGain();
    const volume = clamp(getSettingValue(VOLUME_SETTING_ID, 0.25), 0, 1);

    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, context.currentTime);
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
    source.addEventListener("ended", () => {
      source.disconnect();
      gain.disconnect();
    });
  } catch (error) {
    console.error("Failed to play completion sound", error);
    showToast("error", "Completion sound failed", error?.message ?? String(error));
  }
}

function rememberPrompt(detail) {
  if (detail?.prompt_id) {
    activePromptIds.add(detail.prompt_id);
  }
}

function forgetPrompt(detail) {
  if (detail?.prompt_id) {
    activePromptIds.delete(detail.prompt_id);
  }
}

function isKnownCurrentPrompt(detail) {
  return !detail?.prompt_id || activePromptIds.size === 0 || activePromptIds.has(detail.prompt_id);
}

function showToast(severity, summary, detail) {
  app.extensionManager?.toast?.add?.({
    severity,
    summary,
    detail,
    life: 3000,
  });
}

async function openImageLocation(imageInfo) {
  if (!imageInfo?.filename) {
    showToast("warn", "Open folder", "No saved image is available yet.");
    return;
  }

  try {
    const response = await api.fetchApi(OPEN_LOCATION_ROUTE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: imageInfo.filename,
        subfolder: imageInfo.subfolder ?? "",
        type: imageInfo.type ?? "output",
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok === false) {
      throw new Error(result.error || `Server returned ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to open image location", error);
    showToast("error", "Open folder failed", error?.message ?? String(error));
  }
}

function ensureOpenLocationWidget(node) {
  const existing = node.widgets?.find((widget) => widget.name === "open_image_location");
  if (existing) {
    return existing;
  }

  const widget = node.addWidget("button", "Open Folder", "open", () => {
    openImageLocation(node.__lastSavedImageForOpenLocation);
  });
  widget.name = "open_image_location";
  widget.serialize = false;
  return widget;
}

app.registerExtension({
  name: "Comfy.ExecutionCompletionSound",
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "SaveImage") {
      return;
    }

    const onExecuted = nodeType.prototype.onExecuted;
    nodeType.prototype.onExecuted = function (message) {
      onExecuted?.apply(this, arguments);

      const images = message?.images;
      if (!Array.isArray(images) || images.length === 0) {
        return;
      }

      this.__lastSavedImageForOpenLocation = images[0];
      ensureOpenLocationWidget(this);
      this.setSize(this.computeSize());
    };
  },
  async setup() {
    app.ui?.settings?.addSetting?.({
      id: ENABLED_SETTING_ID,
      name: "Play sound when execution completes",
      category: ["Comfy", "Notifications", "Play sound when execution completes"],
      tooltip: "Plays a short browser sound when the current prompt finishes successfully.",
      type: "boolean",
      defaultValue: true,
    });

    app.ui?.settings?.addSetting?.({
      id: VOLUME_SETTING_ID,
      name: "Execution completion sound volume",
      category: ["Comfy", "Notifications", "Execution completion sound volume"],
      tooltip: "Volume for the execution completion sound, from 0 to 1.",
      type: "number",
      defaultValue: 0.25,
      attrs: {
        min: 0,
        max: 1,
        step: 0.05,
      },
    });

    app.ui?.settings?.addSetting?.({
      id: TEST_SOUND_SETTING_ID,
      name: "Test execution completion sound",
      category: ["Comfy", "Notifications", "Test execution completion sound"],
      tooltip: "Plays the configured execution completion sound now.",
      defaultValue: null,
      type: () => {
        const button = document.createElement("button");
        button.textContent = "Play completion sound";
        button.style.cssText = "padding: 6px 12px; cursor: pointer;";
        button.addEventListener("click", () => {
          unlockAudio();
          lastPlayedAt = 0;
          playCompletionSound();
        });
        return button;
      },
    });

    installAudioUnlockHandlers();

    api.addEventListener("execution_start", ({ detail }) => {
      rememberPrompt(detail);
    });

    api.addEventListener("execution_success", ({ detail }) => {
      if (isKnownCurrentPrompt(detail)) {
        playCompletionSound();
      }
      forgetPrompt(detail);
    });

    api.addEventListener("execution_error", ({ detail }) => {
      forgetPrompt(detail);
    });

    api.addEventListener("execution_interrupted", ({ detail }) => {
      forgetPrompt(detail);
    });
  },
});

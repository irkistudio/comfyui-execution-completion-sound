# ComfyUI Execution Completion Sound

A small ComfyUI custom extension for two workflow conveniences:

- Plays a short sound when a prompt finishes successfully.
- Adds an `Open Folder` button to `SaveImage` nodes after execution. On Windows, Explorer opens with the saved image selected.

## Install

1. Download `comfyui-execution-completion-sound.zip` from the release or product download.
2. Extract it into your ComfyUI `custom_nodes` folder.
3. Confirm the folder path looks like:

   `ComfyUI/custom_nodes/comfyui-execution-completion-sound/`

4. Restart ComfyUI.
5. Refresh the ComfyUI browser window.

## Settings

Open ComfyUI settings and go to:

`Comfy > Notifications`

Available settings:

- `Play sound when execution completes`
- `Execution completion sound volume`
- `Test execution completion sound`

If the sound does not play, click anywhere inside ComfyUI once and press the test button again. Browsers sometimes require one user interaction before audio can play.

## Open Folder Button

After a `SaveImage` node runs, an `Open Folder` button appears on that node. Clicking it opens the saved image location.

- Windows: opens Explorer and selects the saved image.
- macOS: reveals the saved image in Finder.
- Linux: opens the containing folder.

## Notes

- The included sound file is stored at `web/assets/completion.mp3`.
- The `Open Folder` button only opens files inside ComfyUI's `output`, `temp`, or `input` directories.
- No Python package dependencies are required beyond ComfyUI itself.

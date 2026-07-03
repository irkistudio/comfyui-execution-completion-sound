# ComfyUI Execution Completion Sound

I made this for anyone who missed that ComfyUI had finished because it was too quiet.

When execution completes successfully, it plays a short notification sound.

That's all it does.

## Korean

ComfyUI의 작업이 끝났는데 너무 조용해서 모르셨던 분들을 위해 만들었습니다.

실행이 성공적으로 끝나면 짧은 알림음을 재생합니다.

그게 다입니다.

## Install

1. Download `comfyui-execution-completion-sound.zip` from the GitHub release or Gumroad product download.
2. Extract it into your ComfyUI `custom_nodes` folder.
3. Confirm the folder path looks like:

   `ComfyUI/custom_nodes/comfyui-execution-completion-sound/`

4. Restart ComfyUI.
5. Refresh the ComfyUI browser window.

## 설치 방법

1. GitHub 릴리스 또는 Gumroad 제품 다운로드에서 `comfyui-execution-completion-sound.zip` 파일을 다운로드합니다.
2. 압축을 풀어 ComfyUI의 `custom_nodes` 폴더에 넣습니다.
3. 폴더 경로가 아래처럼 되어 있는지 확인합니다.

   `ComfyUI/custom_nodes/comfyui-execution-completion-sound/`

4. ComfyUI를 재시작합니다.
5. ComfyUI 브라우저 창을 새로고침합니다.

## Settings

Open ComfyUI settings and go to:

`Comfy > Notifications`

Available settings:

- `Play sound when execution completes`
- `Execution completion sound volume`
- `Test execution completion sound`

If the sound does not play, click anywhere inside ComfyUI once and press the test button again. Browsers sometimes require one user interaction before audio can play.

## Notes

- The included sound file is stored at `web/assets/completion.mp3`.
- No Python package dependencies are required beyond ComfyUI itself.

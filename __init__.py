import os
import subprocess
import sys

from aiohttp import web

import folder_paths
from server import PromptServer


WEB_DIRECTORY = "./web"

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}


def _resolve_comfy_file(filename: str, subfolder: str, file_type: str) -> str:
    base_dir = folder_paths.get_directory_by_type(file_type)
    if base_dir is None:
        raise ValueError(f"Unsupported file type: {file_type}")

    base_dir = os.path.abspath(base_dir)
    target_dir = os.path.abspath(os.path.join(base_dir, subfolder or ""))
    target_path = os.path.abspath(os.path.join(target_dir, filename))

    if os.path.commonpath([base_dir, target_path]) != base_dir:
        raise ValueError("Resolved path is outside the allowed ComfyUI directory")

    if not os.path.isfile(target_path):
        raise FileNotFoundError(target_path)

    return target_path


def _open_file_location(target_path: str) -> None:
    if os.name == "nt":
        subprocess.Popen(["explorer", f"/select,{target_path}"])
        return

    if sys.platform == "darwin":
        subprocess.Popen(["open", "-R", target_path])
        return

    subprocess.Popen(["xdg-open", os.path.dirname(target_path)])


@PromptServer.instance.routes.post("/execution-completion-sound/open-file-location")
async def open_file_location(request):
    try:
        data = await request.json()
        target_path = _resolve_comfy_file(
            str(data.get("filename") or ""),
            str(data.get("subfolder") or ""),
            str(data.get("type") or "output"),
        )
        _open_file_location(target_path)
        return web.json_response({"ok": True, "path": target_path})
    except FileNotFoundError as err:
        return web.json_response({"ok": False, "error": f"File not found: {err}"}, status=404)
    except Exception as err:
        return web.json_response({"ok": False, "error": str(err)}, status=400)


__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]

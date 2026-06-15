"""Remove dark navy background from Arthiq logos."""
from pathlib import Path
from PIL import Image
import numpy as np

ASSETS = Path(r"C:\Users\gagne\.cursor\projects\d-Gagnesh-Drive-Arthiq-Smart-Personal-Finance-Ledger\assets")
OUT = Path(__file__).resolve().parent.parent / "frontend" / "public"

SOURCES = {
    "logo-full.png": ASSETS / "c__Users_gagne_AppData_Roaming_Cursor_User_workspaceStorage_5964f5b9f2de1520776edb77c69fc7a2_images_IMG_0191-c87a5e81-1abf-460b-8571-9ae50cd8633e.png",
    "logo-icon.png": ASSETS / "c__Users_gagne_AppData_Roaming_Cursor_User_workspaceStorage_5964f5b9f2de1520776edb77c69fc7a2_images_IMG_0192-4a653cf6-9a49-48b4-b208-6c8241accfda.png",
}


def sample_bg_color(img: Image.Image) -> np.ndarray:
    arr = np.array(img.convert("RGB"))
    h, w = arr.shape[:2]
    corners = np.vstack([
        arr[0:8, 0:8].reshape(-1, 3),
        arr[0:8, w - 8:w].reshape(-1, 3),
        arr[h - 8:h, 0:8].reshape(-1, 3),
        arr[h - 8:h, w - 8:w].reshape(-1, 3),
    ])
    return corners.mean(axis=0)


def remove_background(src: Path, dest: Path) -> None:
    img = Image.open(src).convert("RGBA")
    arr = np.array(img, dtype=np.float32)
    rgb = arr[:, :, :3]
    bg = sample_bg_color(img)

    dist = np.linalg.norm(rgb - bg, axis=2)
    brightness = rgb.mean(axis=2)
    max_channel = rgb.max(axis=2)

    # Dark/navy pixels -> transparent; keep neon greens, purples, whites
    alpha = np.clip((dist - 18) / 42, 0, 1)
    alpha = np.where((brightness < 28) & (max_channel < 45), 0, alpha)
    alpha = np.where((brightness < 55) & (dist < 35), alpha * 0.3, alpha)

    # Soften edges
    from PIL import ImageFilter
    alpha_img = Image.fromarray((alpha * 255).astype(np.uint8), mode="L")
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=0.6))
    alpha = np.array(alpha_img, dtype=np.float32) / 255.0

    arr[:, :, 3] = (alpha * 255).astype(np.uint8)
    result = Image.fromarray(arr.astype(np.uint8), mode="RGBA")

    # Trim transparent padding
    bbox = result.getbbox()
    if bbox:
        result = result.crop(bbox)

    OUT.mkdir(parents=True, exist_ok=True)
    result.save(dest, "PNG", optimize=True)
    print(f"Saved {dest} ({result.size[0]}x{result.size[1]})")


if __name__ == "__main__":
    for name, src in SOURCES.items():
        if not src.exists():
            raise FileNotFoundError(src)
        remove_background(src, OUT / name)

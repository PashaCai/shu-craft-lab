"""Build the two classroom downloads with the Python standard library."""
from hashlib import sha256
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
dist = root / "dist"
site = sorted(p for p in dist.rglob("*") if p.is_file())
source = sorted(site + list((root / "scripts").glob("*.mjs")) +
                [root / "scripts/package.py", root / ".gitignore", root / "README.md",
                 root / "package.json", root / "验收报告.md"])
manifest = root / "SHA256SUMS.txt"
manifest.write_bytes("".join(
    f"{sha256(p.read_bytes()).hexdigest()}  {p.relative_to(root).as_posix()}\n"
    for p in source).encode("utf-8"))

for filename, files, base in (
        ("蜀作-纯静态index网页包.zip", site, dist),
        ("蜀作-GitHub-Pages部署包.zip", [*source, manifest], root)):
    archive = root.parent / filename
    with ZipFile(archive, "w", ZIP_DEFLATED, compresslevel=9) as z:
        for p in files:
            z.write(p, p.relative_to(base).as_posix())
    with ZipFile(archive) as z:
        assert z.testzip() is None
        assert set(z.namelist()) == {p.relative_to(base).as_posix() for p in files}
        assert all(z.read(p.relative_to(base).as_posix()) == p.read_bytes() for p in files)
    archive.with_suffix(".zip.sha256").write_bytes(
        f"{sha256(archive.read_bytes()).hexdigest()}  {archive.name}\n".encode("utf-8"))
    print(f"Verified {len(files)} files: {filename}")

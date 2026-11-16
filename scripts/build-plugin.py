"""Package the Proofline kit as a Claude plugin zip for upload ("My Uploads" on claude.ai).

    python scripts/build-plugin.py

Writes dist/proofline-plugin.zip with this layout:

    .claude-plugin/plugin.json
    skills/proofline-build/   the kit: SKILL.md, prompts, self-test, templates/, library/*.md
    skills/proofline-plan/    skills/proofline-audit/    skills/proofline-runtime/

Left out on purpose: the research PDFs (other people's copyright), templates/five-agent-build/
(the old nested copy), selftest-run/ (build records) and scripts/ (tools for this repository).
Standard library only.
"""
import io
import json
import os
import re
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "dist", "proofline-plugin.zip")
KIT_FILES = ["SKILL.md", "README.md", "UNIVERSAL-PROMPT.md", "COMPACT-PROMPT.txt", "KIT-SELFTEST.md"]
COMPANIONS = ["proofline-plan", "proofline-audit", "proofline-runtime"]


def read(rel):
    with io.open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        return fh.read()


def version():
    m = re.search(r"^# .*\(v([\d.]+) candidate\)", read("SKILL.md"), re.M)
    if not m:
        raise SystemExit("SKILL.md title carries no version")
    parts = m.group(1).split(".")
    return ".".join((parts + ["0", "0"])[:3])


def files_under(rel_dir, skip=()):
    base = os.path.join(ROOT, rel_dir)
    for dirpath, dirnames, filenames in os.walk(base):
        rel = os.path.relpath(dirpath, ROOT).replace("\\", "/")
        dirnames[:] = sorted(d for d in dirnames if f"{rel}/{d}" not in skip and d != "__pycache__")
        for f in sorted(filenames):
            if not f.lower().endswith(".pdf"):
                yield f"{rel}/{f}"


def main():
    v = version()
    manifest = {
        "name": "proofline",
        "version": v,
        "description": (
            "Proofline: a contract-first build method. Four skills: proofline-build (contract written "
            "examples-first, a spec gate that ends, scoped builders, fresh QA, evidence on every claim), "
            "proofline-plan (decide whether work needs organizing, then split and staff it), proofline-audit "
            "(test whether each agent earns its place) and proofline-runtime (design the software that "
            "enforces a workflow). Candidate: see the self-test record before relying on it."
        ),
        "author": {"name": "Proofline contributors"},
        "keywords": ["build", "contract", "spec", "qa", "agents", "evidence"],
    }
    entries = {".claude-plugin/plugin.json": json.dumps(manifest, indent=2) + "\n"}
    for f in KIT_FILES:
        entries[f"skills/proofline-build/{f}"] = read(f)
    for rel in files_under("templates", skip={"templates/five-agent-build"}):
        entries[f"skills/proofline-build/{rel}"] = read(rel)
    for rel in files_under("library"):
        if rel.endswith(".md"):
            entries[f"skills/proofline-build/{rel}"] = read(rel)
    for name in COMPANIONS:
        entries[f"skills/{name}/SKILL.md"] = read(f"skills/{name}/SKILL.md")

    for path, text in entries.items():
        if path.endswith("SKILL.md"):
            m = re.match(r"^---\n(.*?)\n---\n", text.replace("\r\n", "\n"), re.S)
            name = re.search(r"^name:\s*(.+)$", m.group(1), re.M).group(1).strip() if m else None
            folder = path.split("/")[1]
            if name != folder:
                raise SystemExit(f"{path}: skill is named {name}, folder is {folder}")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for path in sorted(entries):
            z.writestr(path, entries[path].replace("\r\n", "\n"))
    print(f"wrote {os.path.relpath(OUT, ROOT)}: proofline {v}, {len(entries)} files, "
          f"{os.path.getsize(OUT):,} bytes")
    return entries


def install(entries, target):
    """Write the four skill folders into a skills folder, replacing earlier copies of them."""
    target = os.path.abspath(os.path.expanduser(target))
    names = sorted({p.split("/")[1] for p in entries if p.startswith("skills/")})
    for name in names:
        folder = os.path.join(target, name)
        if os.path.isdir(folder):
            shutil.rmtree(folder)
    for path, text in entries.items():
        if not path.startswith("skills/"):
            continue
        dest = os.path.join(target, *path.split("/")[1:])
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with io.open(dest, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text.replace("\r\n", "\n"))
    print(f"installed {', '.join(names)} into {target}")


if __name__ == "__main__":
    import argparse
    import shutil
    parser = argparse.ArgumentParser(description="Package Proofline as a plugin zip.")
    parser.add_argument("--install", metavar="SKILLS_DIR",
                        help="also write the four skill folders into this skills folder, e.g. ~/.claude/skills")
    args = parser.parse_args()
    built = main()
    if args.install:
        install(built, args.install)

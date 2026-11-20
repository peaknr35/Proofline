"""Package the Proofline kit as a Claude plugin zip for upload ("My Uploads" on claude.ai).

    python _tools/build-plugin.py
    python _tools/build-plugin.py --install ~/.claude/skills --agents ~/.claude/agents

kit/ is already laid out as the plugin, so the zip is kit/ as it is, plus:

    .claude-plugin/plugin.json      written here, version from the proofline-build SKILL.md title
    skills/proofline-build/README.md  the repo's README, so the installed skill explains itself

Left out: the research PDFs (other people's copyright), generated folders (.venv, caches,
*.egg-info), and uv.lock. builds/ (records) and _tools/ (repo upkeep) are outside kit/.
Standard library only.
"""
import io
import json
import os
import re
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIT = os.path.join(ROOT, "kit")
SKIP_DIRS = {".venv", ".pytest_cache", "__pycache__", "node_modules"}
OUT = os.path.join(ROOT, "dist", "proofline-plugin.zip")
SKILLS = ["proofline-build", "proofline-plan", "proofline-audit", "proofline-runtime"]
AGENTS = ["proofline-lead", "proofline-researcher", "proofline-architect", "proofline-builder", "proofline-qa"]


def read(rel):
    with io.open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        return fh.read()


def version():
    m = re.search(r"^# .*\(v([\d.]+) candidate\)", read("kit/skills/proofline-build/SKILL.md"), re.M)
    if not m:
        raise SystemExit("SKILL.md title carries no version")
    parts = m.group(1).split(".")
    return ".".join((parts + ["0", "0"])[:3])


def kit_files():
    """Every shippable file under kit/, as a zip path."""
    for dirpath, dirnames, filenames in os.walk(KIT):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS and not d.endswith(".egg-info"))
        for f in sorted(filenames):
            if f.lower().endswith(".pdf") or f == "uv.lock":
                continue
            yield os.path.relpath(os.path.join(dirpath, f), KIT).replace("\\", "/")


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
            "enforces a workflow). Five agents: proofline-lead, proofline-researcher (deep research), "
            "proofline-architect (ICM structure and flow), proofline-builder and proofline-qa. Candidate: see the self-test record before relying on it."
        ),
        "author": {"name": "Proofline contributors"},
        "keywords": ["build", "contract", "spec", "qa", "agents", "evidence", "research", "architecture"],
    }
    entries = {".claude-plugin/plugin.json": json.dumps(manifest, indent=2) + "\n"}
    for rel in kit_files():
        entries[rel] = read(f"kit/{rel}")
    entries["skills/proofline-build/README.md"] = read("README.md")
    missing = [f"skills/{n}/SKILL.md" for n in SKILLS if f"skills/{n}/SKILL.md" not in entries]
    missing += [f"agents/{n}.md" for n in AGENTS if f"agents/{n}.md" not in entries]
    if missing:
        raise SystemExit(f"kit/ is missing {', '.join(missing)}")

    for path, text in entries.items():
        if path.endswith("SKILL.md"):
            m = re.match(r"^---\n(.*?)\n---\n", text.replace("\r\n", "\n"), re.S)
            name = re.search(r"^name:\s*(.+)$", m.group(1), re.M).group(1).strip() if m else None
            folder = path.split("/")[1]
            if name != folder:
                raise SystemExit(f"{path}: skill is named {name}, folder is {folder}")
        elif path.startswith("agents/"):
            m = re.match(r"^---\n(.*?)\n---\n", text.replace("\r\n", "\n"), re.S)
            name = re.search(r"^name:\s*(.+)$", m.group(1), re.M).group(1).strip() if m else None
            if name != path[len("agents/"):-len(".md")]:
                raise SystemExit(f"{path}: agent is named {name}")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for path in sorted(entries):
            z.writestr(path, entries[path].replace("\r\n", "\n"))
    print(f"wrote {os.path.relpath(OUT, ROOT)}: proofline {v}, {len(entries)} files, "
          f"{os.path.getsize(OUT):,} bytes")
    return entries


def install_agents(entries, target):
    """Write the five agent files into an agents folder, e.g. ~/.claude/agents."""
    target = os.path.abspath(os.path.expanduser(target))
    os.makedirs(target, exist_ok=True)
    names = []
    for path, text in sorted(entries.items()):
        if path.startswith("agents/"):
            with io.open(os.path.join(target, path[len("agents/"):]), "w", encoding="utf-8", newline="\n") as fh:
                fh.write(text.replace("\r\n", "\n"))
            names.append(path[len("agents/"):-len(".md")])
    print(f"installed agents {', '.join(names)} into {target}")


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
    parser.add_argument("--agents", metavar="AGENTS_DIR",
                        help="also write the five agent files into this agents folder, e.g. ~/.claude/agents")
    args = parser.parse_args()
    built = main()
    if args.install:
        install(built, args.install)
    if args.agents:
        install_agents(built, args.agents)

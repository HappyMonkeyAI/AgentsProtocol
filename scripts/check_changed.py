#!/usr/bin/env python3
"""Run validation lanes selected from committed, modified, and untracked paths."""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from fnmatch import fnmatch
import json
from pathlib import Path
import subprocess
import sys


def load_config(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or set(data) != {"version", "lanes"}:
        raise ValueError("config must contain only version and lanes")
    if data["version"] != 1 or not isinstance(data["lanes"], list):
        raise ValueError("version must be 1 and lanes must be an array")
    names: set[str] = set()
    for lane in data["lanes"]:
        if not isinstance(lane, dict) or set(lane) != {"name", "paths", "command"}:
            raise ValueError("lane keys must be exactly name, paths, and command")
        if (
            not isinstance(lane["name"], str)
            or not lane["name"]
            or lane["name"] in names
            or not isinstance(lane["paths"], list)
            or not lane["paths"]
            or not all(isinstance(value, str) and value for value in lane["paths"])
            or not isinstance(lane["command"], list)
            or not lane["command"]
            or not all(isinstance(value, str) and value for value in lane["command"])
        ):
            raise ValueError("lane names, paths, and commands must be non-empty string arrays")
        names.add(lane["name"])
    return data["lanes"]


def git_changed_paths(repo: Path, base: str) -> list[str]:
    tracked = subprocess.run(
        ["git", "diff", "--name-only", "-z", "--diff-filter=ACDMRTUXB", base, "--"],
        cwd=repo,
        capture_output=True,
        check=True,
    ).stdout.split(b"\0")
    untracked = subprocess.run(
        ["git", "ls-files", "-z", "--others", "--exclude-standard"],
        cwd=repo,
        capture_output=True,
        check=True,
    ).stdout.split(b"\0")
    return list(dict.fromkeys(path.decode() for path in tracked + untracked if path))


def select_lanes(lanes: list[dict], changed_paths: list[str]) -> list[dict]:
    return [
        lane for lane in lanes
        if any(fnmatch(path, pattern) for path in changed_paths for pattern in lane["paths"])
    ]


def out_of_scope(changed_paths: list[str], owned_patterns: list[str]) -> list[str]:
    """Return changed paths that do not match at least one owned glob."""
    return [
        path for path in changed_paths
        if not any(fnmatch(path, pattern) for pattern in owned_patterns)
    ]


def run_lane(repo: Path, log_dir: Path, lane: dict) -> tuple[str, int, Path]:
    log_path = log_dir / f"{lane['name']}.log"
    try:
        result = subprocess.run(lane["command"], cwd=repo, text=True, capture_output=True)
        output = result.stdout + result.stderr
        code = result.returncode
    except OSError as error:
        output = f"unable to execute {lane['command'][0]}: {error}\n"
        code = 127
    log_path.write_text(output, encoding="utf-8")
    return lane["name"], code, log_path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="HEAD")
    parser.add_argument("--config", type=Path, default=Path(__file__).with_name("checks.json"))
    parser.add_argument("--owned", nargs="+", help="owned path globs; fail if any changed path is outside them")
    args = parser.parse_args(argv)
    repo = Path.cwd()
    try:
        lanes = load_config(args.config)
        changed = git_changed_paths(repo, args.base)
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        print(f"ERROR {error}", file=sys.stderr)
        return 2
    if args.owned:
        unexpected = out_of_scope(changed, args.owned)
        if unexpected:
            print("SCOPE FAIL out-of-scope paths:", file=sys.stderr)
            print("\n".join(f"- {path}" for path in unexpected), file=sys.stderr)
            return 3
        print(f"SCOPE PASS {len(changed)} changed paths")
    selected = select_lanes(lanes, changed)
    if not selected:
        print(f"SKIP no lanes selected ({len(changed)} changed files)")
        return 0
    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    log_dir = repo / ".tmp" / "check-runs" / run_id
    log_dir.mkdir(parents=True)
    with ThreadPoolExecutor(max_workers=len(selected)) as executor:
        results = list(executor.map(lambda lane: run_lane(repo, log_dir, lane), selected))
    failures = 0
    for name, code, log_path in results:
        status = "PASS" if code == 0 else "FAIL"
        failures += code != 0
        print(f"{status} {name} (exit {code}) log={log_path.relative_to(repo)}")
    print(f"SUMMARY {len(results) - failures} passed, {failures} failed")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())

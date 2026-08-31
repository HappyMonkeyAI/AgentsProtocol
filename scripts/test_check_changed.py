import json
import tempfile
import unittest
from pathlib import Path

try:
    from .check_changed import git_changed_paths, load_config, out_of_scope, select_lanes
except ImportError:
    from check_changed import git_changed_paths, load_config, out_of_scope, select_lanes


class CheckChangedTests(unittest.TestCase):
    def test_selects_only_lanes_matching_changed_paths(self):
        lanes = [
            {"name": "client", "paths": ["client/**"], "command": ["true"]},
            {"name": "server", "paths": ["server/**"], "command": ["true"]},
        ]
        self.assertEqual(["client"], [lane["name"] for lane in select_lanes(lanes, ["client/src/main.ts"])])

    def test_rejects_shell_command_and_duplicate_names(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "checks.json"
            path.write_text(json.dumps({"version": 1, "lanes": [{"name": "x", "paths": ["*"], "command": "npm test"}]}))
            with self.assertRaises(ValueError):
                load_config(path)

    def test_includes_untracked_files(self):
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)
            import subprocess
            subprocess.run(["git", "init", "-q"], cwd=repo, check=True)
            (repo / "tracked.txt").write_text("tracked")
            subprocess.run(["git", "add", "tracked.txt"], cwd=repo, check=True)
            subprocess.run(["git", "commit", "-qm", "initial"], cwd=repo, check=True)
            (repo / "untracked.txt").write_text("untracked")
            self.assertIn("untracked.txt", git_changed_paths(repo, "HEAD"))

    def test_scope_check_rejects_paths_outside_owned_globs(self):
        self.assertEqual(["server/index.ts"], out_of_scope(["client/main.ts", "server/index.ts"], ["client/**"]))


if __name__ == "__main__":
    unittest.main()

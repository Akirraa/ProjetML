import subprocess
import sys
import os

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    script_path = os.path.join(base_dir, "Back", "scripts", "train_multiple_configs.py")
    
    print(f"Wrapper: Executing train_multiple_configs.py at {script_path}")
    result = subprocess.run([sys.executable, script_path] + sys.argv[1:], cwd=base_dir)
    sys.exit(result.returncode)

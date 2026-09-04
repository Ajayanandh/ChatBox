import os
import sys
import time
import subprocess
import webbrowser
import signal
import socket
from urllib.request import urlopen

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

BACKEND_PORT = 8000
FRONTEND_PORT = 3000

processes = []


def is_port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0


def wait_for_service(url: str, timeout: int = 30) -> bool:
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with urlopen(url, timeout=1) as resp:
                if resp.status in (200, 404):
                    return True
        except Exception:
            time.sleep(0.5)
    return False


def cleanup(signum=None, frame=None):
    print("\n[ChatBox] Shutting down all background processes...")
    for p in processes:
        try:
            if sys.platform == "win32":
                subprocess.call(["taskkill", "/F", "/T", "/PID", str(p.pid)])
            else:
                p.terminate()
        except Exception:
            pass
    print("[ChatBox] Application stopped cleanly.")
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    print("=" * 60)
    print("      🚀 Starting ChatBox Personal AI Assistant 🚀      ")
    print("=" * 60)

    # 1. Start Backend FastAPI server
    print(f"\n[1/3] Starting FastAPI backend on http://127.0.0.1:{BACKEND_PORT}...")
    backend_env = os.environ.copy()
    backend_env["PYTHONPATH"] = BACKEND_DIR

    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(BACKEND_PORT)],
        cwd=BACKEND_DIR,
        env=backend_env,
        shell=(sys.platform == "win32"),
    )
    processes.append(backend_proc)

    # 2. Wait for backend health
    print("      Waiting for backend to be ready...")
    if not wait_for_service(f"http://127.0.0.1:{BACKEND_PORT}/api/health", timeout=15):
        print("⚠️  Warning: Backend health check took longer than expected. Continuing...")

    # 3. Start Frontend Next.js server
    print(f"\n[2/3] Starting Next.js frontend on http://127.0.0.1:{FRONTEND_PORT}...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"

    # Check if .next build directory exists, if so run start, else run dev
    next_build_dir = os.path.join(FRONTEND_DIR, ".next")
    npm_script = "start" if os.path.exists(next_build_dir) else "dev"

    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", npm_script],
        cwd=FRONTEND_DIR,
        shell=(sys.platform == "win32"),
    )
    processes.append(frontend_proc)

    # 4. Wait for frontend and launch browser
    print(f"\n[3/3] Launching web app in default browser...")
    wait_for_service(f"http://127.0.0.1:{FRONTEND_PORT}", timeout=30)
    webbrowser.open(f"http://127.0.0.1:{FRONTEND_PORT}")

    print("\n" + "=" * 60)
    print(f" ChatBox is live at: http://127.0.0.1:{FRONTEND_PORT}")
    print(f" API Documentation:  http://127.0.0.1:{BACKEND_PORT}/docs")
    print(" Press Ctrl+C in this terminal to exit.")
    print("=" * 60 + "\n")

    try:
        while True:
            time.sleep(1)
            # Check if any process terminated prematurely
            if backend_proc.poll() is not None or frontend_proc.poll() is not None:
                print("One of the subservices terminated. Exiting...")
                break
    except KeyboardInterrupt:
        cleanup()


if __name__ == "__main__":
    main()

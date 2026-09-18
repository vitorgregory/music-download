from app import app, socketio
import os
import signal
import subprocess

if __name__ == '__main__':
    react_server = subprocess.Popen(
        ["node", ".output/server/index.mjs"],
        env={**os.environ, "HOST": "127.0.0.1", "PORT": "3000"},
    )
    try:
        socketio.run(app, host="0.0.0.0", port=5000, debug=False, allow_unsafe_werkzeug=True)
    finally:
        react_server.send_signal(signal.SIGTERM)
        react_server.wait(timeout=10)
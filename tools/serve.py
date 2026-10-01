"""Static server with CORS and no caching, like GitHub Pages for our purposes."""
import http.server, sys

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
http.server.ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()

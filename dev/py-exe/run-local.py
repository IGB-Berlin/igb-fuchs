# pylint: disable=C0103,C0114,C0115,C0116
import http.server
import webbrowser
import threading
from pathlib import Path

DIR = (Path(__file__).parent/'web').resolve(strict=True)
PORT = 1234


class MyServer(http.server.ThreadingHTTPServer):

    def finish_request(self, request, client_address):
        self.RequestHandlerClass(request, client_address, self, directory=DIR)


def main():
    handler = http.server.SimpleHTTPRequestHandler
    print('\nWARNING: Not for production use, this server is not secure!\n')
    with MyServer(('127.0.0.1', PORT), handler) as httpd:
        server_thread = threading.Thread(target=httpd.serve_forever)
        server_thread.start()
        addr = f'http://localhost:{PORT}/'
        webbrowser.open(addr)
        print(f'Serving at {addr}')
        print('\n\n=========> Press Enter to stop server <=========\n\n')
        input()
        httpd.shutdown()
    print('Clean shutdown')


if __name__ == '__main__':
    main()

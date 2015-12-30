La Fabrique de la Loi / The Law Factory
=======================================

Web frontend developed for The Law Factory project: http://www.LaFabriqueDeLaLoi.fr

Data backend API code is available on repository https://github.com/RegardsCitoyens/the-law-factory-parser

## Installation

* Checkout the project from git:

  ```bash
    git clone https://github.com/regardscitoyens/the-law-factory.git
    cd the-law-factory
  ```

* Configure the aplication by copying ```js/config.js.example``` as ```public/js/config.js``` and set the API Url to the path on which you serve the data directory of RegardsCitoyens:the-law-factory-parser.git. Optionnally set also there your google analytics id and host.

  ```bash
    cp public/js/config.js{.example,}
    vi public/js/config.js
  ```

* Serve the ```public``` directory on a webserver
 - for instance, to run locally on http://localhost:8001

  ```bash
    cd public
    python -m SimpleHTTPServer 8001
  ```

 - for production, a sample Apache configuration is given in the ```conf``` directory


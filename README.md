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

* Configure the aplication by copying `public/config.js.example` as `public/config.js` and set the API Url to the path on which you serve the data directory of RegardsCitoyens:the-law-factory-parser.git. Optionnally set also there your google analytics id and host.

  ```bash
    cp public/config.js{.example,}
    vi public/config.js
  ```

* Serve the `public` directory on a webserver
 - for instance, to run locally on http://localhost:8001

  ```bash
    cd public
    python -m SimpleHTTPServer 8001
  ```

## Production setup

A sample Apache configuration is given in the `conf` directory.

To reduce browser request counts per page, you may build a production version that uses concatenated versions of scripts and stylesheets by running `make` and `make install` from the repository root.  In this case you will want to serve the `prod` directory instead.

Notes:
* if you haven't created `public/config.js` yet, it will be copied from `public/config.js.example`
* you have to run `make` and `make install` again if you make any changes to the `public/config.js` file
* you may run `make clean` to return the tree to its original, fresh-from-git-repository state, but leaves the `prod` directory.


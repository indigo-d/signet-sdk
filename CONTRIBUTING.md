# Developer Notes

Developer notes for contributing to this Node JS library.

## Development Environment Setup

  - Ubuntu 16.04 LTS setup:
    - To setup NodeJS:
      - ``` curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash - ```
      - ``` apt-get install nodejs ```
      - After installation, ``` which nodejs ``` should show: /usr/bin/nodejs
      - Also, ``` nodejs --version ``` should show 'v9.11.1'
      - And, ``` npm -V ``` should show 'npm@5.6.0 /usr/lib/node_modules/npm'

## Software Setup

  - Clone the repo (make sure you are on the 'develop' branch)
  - Run: ``` npm install ```

## Testing

Once Node JS is installed, do the following:

  - Run: ``` npm test ``` (Note: this will run the unit tests only!)
  - ``` make ut ``` will run the unit tests
  - ``` make it ``` will run the integration tests (Note: The API server must be running on localhost:1337)
  - ``` make test ``` will run both the unit tests and the integration tests

## JSDOC Documentation

  - Follow the JSDOC convention and add comments in code.
  - When ready to check in, run ``` make doc ```.
  - This will generate the documentation.  Look at doc/index.html to see how it would look.
  - Commit your docs along with your code changes.

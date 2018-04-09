# Developer Notes

Developer notes for contributing to this Node JS library.

## Development Setup

  - Ubuntu 16.04 LTS setup:
    - To setup NodeJS:
      - ``` curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash - ```
      - ``` apt-get install nodejs ```
      - After installation, ``` which nodejs ``` should show: /usr/bin/nodejs
      - Also, ``` nodejs --version ``` should show 'v9.11.1'
      - And, ``` npm -V ``` should show 'npm@5.6.0 /usr/lib/node_modules/npm'

## Testing Setup

Once Node JS is installed, do the following:

  - To install mocha globally: ``` npm install --global mocha ```
  - To add mocha to this package's module dependenices: ``` npm install --save-dev mocha ```

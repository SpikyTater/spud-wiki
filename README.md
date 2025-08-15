# Spud Wiki

[Click here for the live version.](https://spikytater.github.io/spud-wiki/)

## How to build locally

### Open console

Open a command prompt inside the main directory of the repository you have cloned/downloaded.

### Step 1: Install module dependencies

To install any module dependencies, run:

    npm ci
There are currently none, but some may be added in the future.

### Step 2: Build

To create a development build of the Wiki, run:

    npm run build:dev

Currently is has no difference with the production build, but that may change.

You can find other scripts you can run inside 'package.json' and they can be used like this:

    npm run <script_name>

## How to test locally using Visual Studio Code

Requires you to have Visual Studio Code installed.

### Step 1: Install NodeJS

Download it from the [official website](https://nodejs.org/en/download) and install it.
I'm currently using version 22.18.0 and I have no idea if previous version would work, although they probably will.

The workflow to deploy the wiki to GitHub Pages also uses version 22.

### Step 2: Install 'Live Server' VS Code extension

[You can find it here](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).

### Step 3: Update your 'settings.json' file

Add the following lines to 'settings.json' located in the '.vscode' directory:

    "liveServer.settings.root": "/",
    "liveServer.settings.mount": [
      ["/spud-wiki", "./build"]
    ],
    "liveServer.settings.file": "/build/index.html",
    "liveServer.settings.host": "localhost"

### Step 4: Profit

Now you can test the Wiki locally on your browser by pressing "Go Live", found on the right side of VS Code's bottom panel.

## Testing an article

A webpage where contributors will be able to test their own articles is currently in the making (it's actually not, but it's a great idea, innit?).

For now, you can use a file named 'test.txt' inside the docs subdirectory. It will only be built with the development build and it is set to be ignored by git.

Your test page will always show on top of the navigation panel on the left as 'TEST', not matter what title you give it.

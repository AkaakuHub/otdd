# Extensions Directory

Place your Chrome extensions in this directory. Each extension should be in its own subdirectory with a valid `manifest.json` file.

## Supported Extensions

- Old TweetDeck extensions
- CSS customization extensions
- Twitter/X helper extensions

## Directory Structure

```
extensions/
├── old-tweetdeck/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   └── ...
├── custom-css-helper/
│   ├── manifest.json
│   ├── styles.css
│   └── ...
└── other-extension/
    ├── manifest.json
    └── ...
```

## Installation

1. Download or create your extension
2. Extract/place it in this directory
3. Restart the application
4. The extension will be automatically loaded

## Notes

- Extensions must have a valid `manifest.json` file
- Extensions are loaded automatically on application startup
- Check the console for loading errors if an extension doesn't work
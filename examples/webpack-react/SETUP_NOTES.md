# Setup Notes for webpack-react Example

## Missing Dependencies

The `package.json` file needs to be updated to include CSS loaders required by the webpack configuration.

Please add these dependencies to the `devDependencies` section:

```json
"css-loader": "^7.1.2",
"style-loader": "^4.0.0"
```

## Installation Steps

After updating package.json, run:

```bash
pnpm install
```

## Complete package.json devDependencies

The complete devDependencies section should look like:

```json
"devDependencies": {
  "@magicmock/unplugin": "workspace:*",
  "@types/node": "^22.10.2",
  "@types/react": "^18.3.12",
  "@types/react-dom": "^18.3.1",
  "css-loader": "^7.1.2",
  "html-webpack-plugin": "^5.6.3",
  "rimraf": "^6.0.1",
  "style-loader": "^4.0.0",
  "ts-loader": "^9.5.1",
  "typescript": "^5.7.2",
  "webpack": "^5.97.1",
  "webpack-cli": "^6.0.1",
  "webpack-dev-server": "^5.2.0"
}
```

const protocol = process.env.WDS_SOCKET_PROTOCOL;

if (protocol) {
  const configPath = require.resolve('react-scripts/config/webpackDevServer.config');
  const createWebpackDevServerConfig = require(configPath);

  require.cache[configPath].exports = (...args) => {
    const config = createWebpackDevServerConfig(...args);

    config.client = config.client || {};
    config.client.webSocketURL = config.client.webSocketURL || {};
    config.client.webSocketURL.protocol = protocol;

    return config;
  };
}

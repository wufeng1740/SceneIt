// Default settings (which may be overriden)
const defaults = {
  app: {
    public_dir: './public',
  },
  db: {
    host: 'localhost',
    user: 'root',
    port: 3306,
    name: 'sceneit',
    password: ''
  },
  server: {
    port: 3000
  }
};

module.exports = defaults;

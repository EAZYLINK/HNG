require('dotenv').config()

module.exports = {
  development: {
    username: "postgres",
    password: "root",
    database: "authapp_dev",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  test: {
    username: "postgres",
    password: "root",
    database: "authapp_dev",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: "postgres"
  }
}

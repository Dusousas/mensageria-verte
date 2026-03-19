const app = require('./src/app');
const { port } = require('./config/env');

app.listen(port, () => {
  console.log(`Email service running on port ${port}`);
});

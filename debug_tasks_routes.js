const router = require('./routes/tasks');
const routes = router.stack.map(mw => {
  if (mw.route) {
    return { path: mw.route.path, methods: mw.route.methods };
  }
  return { name: mw.name };
});
console.log(JSON.stringify(routes, null, 2));

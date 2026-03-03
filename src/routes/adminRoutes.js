const context = require.context("../pages/admin", false, /\.jsx$/);

export const adminRoutes = context.keys()
    .filter((path) => context(path).adminConfig)
    .map((path) => {
        const fileName = path.replace("./", "").replace(".jsx", "");
        const name = fileName.toLowerCase();
        const module = context(path);

        return {
            path: name,
            component: module.default,
            ...module.adminConfig,
        };
    });

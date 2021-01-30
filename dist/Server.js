"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const express_1 = __importDefault(require("express"));
const Utils_1 = require("./Utils");
const HTTPError_1 = require("./HTTPError");
require("express-async-errors");
require("missing-native-js-functions");
const body_parser_1 = __importDefault(require("body-parser"));
// Overwrite default options for Router with default value true for mergeParams
const oldRouter = express_1.default.Router;
express_1.default.Router = function (options) {
    if (!options)
        options = {};
    if (options.mergeParams == null)
        options.mergeParams = true;
    return oldRouter(options);
};
class Server {
    constructor(opts) {
        if (!opts)
            opts = {};
        if (!opts.port)
            opts.port = 8080;
        if (!opts.host)
            opts.host = "0.0.0.0";
        if (opts.production == null)
            opts.production = false;
        if (opts.errorHandler == null)
            opts.errorHandler = true;
        if (opts.jsonBody == null)
            opts.jsonBody = true;
        this.options = opts;
        this.app = express_1.default();
    }
    errorHandler() {
        this.app.use((error, req, res, next) => {
            let code = 400;
            let message = error === null || error === void 0 ? void 0 : error.toString();
            if (error instanceof HTTPError_1.HTTPError && error.code)
                code = error.code;
            else {
                console.error(error);
                if (this.options.production) {
                    message = "Internal Server Error";
                }
                code = 500;
            }
            res.status(code).json({ success: false, code: code, error: true, message });
            return next();
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((res) => this.app.listen(this.options.port, () => res()));
            Utils_1.log(`[Server] started on ${this.options.host}:${this.options.port}`);
        });
    }
    registerRoutes(root) {
        return __awaiter(this, void 0, void 0, function* () {
            this.app.use((req, res, next) => {
                req.server = this;
                next();
            });
            if (this.options.jsonBody)
                this.app.use(body_parser_1.default.json());
            const result = yield Utils_1.traverseDirectory({ dirname: root, recursive: true }, this.registerRoute.bind(this, root));
            if (this.options.errorHandler)
                this.errorHandler();
            return result;
        });
    }
    registerRoute(root, file) {
        var _a, _b;
        if (root.endsWith("/") || root.endsWith("\\"))
            root = root.slice(0, -1); // removes slash at the end of the root dir
        let path = file.replace(root, ""); // remove root from path and
        path = path.split(".").slice(0, -1).join("."); // trancate .js/.ts file extension of path
        path = path.replaceAll("#", ":");
        if (path.endsWith("/index"))
            path = path.slice(0, -6); // delete index from path
        if (!path.length)
            path = "/"; // first root index.js file must have a / path
        try {
            var router = require(file);
            if (router.router)
                router = router.router;
            if (router.default)
                router = router.default;
            if (!router || ((_b = (_a = router === null || router === void 0 ? void 0 : router.prototype) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name) !== "router")
                throw `File doesn't export any default router`;
            this.app.use(path, router);
            Utils_1.log(`[Server] Route ${path} registered`);
            return router;
        }
        catch (error) {
            console.error(new Error(`[Server] Failed to register route ${path}: ${error}`));
        }
    }
    stop() {
        return new Promise((res) => this.http.close(() => res()));
    }
}
exports.Server = Server;
//# sourceMappingURL=Server.js.map
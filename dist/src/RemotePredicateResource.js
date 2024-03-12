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
Object.defineProperty(exports, "__esModule", { value: true });
const Predicate_1 = require("./Predicate");
const dotenv_safe_1 = require("dotenv-safe");
(0, dotenv_safe_1.config)();
/**
 * Call the static from_env() method to fetch a predicate from an endpoint at the env var base url PREDICATE_SERVICE_URL + "/api/v1/predicate"
 * This api searches for updates to the predicate every 2 minutes. Call stopInteravl() to stop the fetching of updates
 */
class RemotePredicateResource {
    constructor(predicate) {
        this.UPDATE_TIME = 2000 * 60;
        this.mPredicate = predicate;
        this.startInterval();
    }
    static from_env() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let url = process.env.PREDICATE_SERVICE_URL;
                if (!url) {
                    throw new Error("Invalid predicate service url");
                }
                url = `${url}/api/v1/predicate`;
                const response = yield this.fetchPredicate(url);
                if (response) {
                    const pred = yield response.text();
                    const predicate = Predicate_1.default.from_json(pred);
                    return new RemotePredicateResource(predicate);
                }
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
    static fetchPredicateAndStoreEtag(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch data: ${response.statusText}`);
                }
                const etag = response.headers.get('ETag');
                if (etag) {
                    RemotePredicateResource.ETAG = etag;
                }
                return response;
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
    static fetchPredicate(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const etag = RemotePredicateResource.ETAG;
            if (!etag) {
                return yield this.fetchPredicateAndStoreEtag(url);
            }
            try {
                const response = yield fetch(url, {
                    headers: {
                        'If-None-Match': etag,
                    },
                });
                if (response.status === 304) {
                    return undefined;
                }
                else if (response.ok) {
                    const newEtag = response.headers.get('ETag');
                    if (newEtag) {
                        RemotePredicateResource.ETAG = newEtag;
                    }
                    return response;
                }
                else {
                    throw new Error(`Failed to fetch data: ${response.statusText}`);
                }
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
    startInterval() {
        this.mInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            const response = yield RemotePredicateResource.fetchPredicate(`${process.env.PREDICATE_SERVICE_URL}/api/v1/predicate`);
            if (response) {
                const pred = yield response.text();
                this.mPredicate = Predicate_1.default.from_json(pred);
            }
        }), this.UPDATE_TIME);
    }
    stopInterval() {
        clearInterval(this.mInterval);
    }
    get predicate() {
        return this.mPredicate;
    }
}
exports.default = RemotePredicateResource;

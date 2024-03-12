"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OperatorTypes_1 = require("./OperatorTypes");
/**
 * Call the static method from_json with a predicate string for a feature and operation.
 * Alternatively you can create an instance with an object of type PredicateProp to the constructor.
 */
class Predicate {
    constructor({ feature, operation }) {
        this.feature = feature;
        this.featureArr = feature === "" ? [] : feature.split(".");
        this.operation = Object.assign({}, operation);
    }
    static from_json(json_string) {
        try {
            return new Predicate(JSON.parse(json_string));
        }
        catch (error) {
            throw new Error("Parsing Json failed, please verify the predicate json string is valid");
        }
    }
    /**
     *
     * @param root Object that may contain nested objects and is the object to test the feature.
     * @returns A boolean of whether the object matches the feature with the predicates or not.
     */
    evaluate(root) {
        const getNestedObj = (obj) => {
            if (this.featureArr.length === 0) {
                return obj;
            }
            let current = obj;
            for (let i = 1; i < this.featureArr.length; i++) {
                if (!current.hasOwnProperty(this.featureArr[i])) {
                    throw new Error("Property does not exist in nested object");
                }
                current = current[this.featureArr[i]];
            }
            return current;
        };
        const testFeature = (operator, operand, feat) => {
            switch (operator) {
                case OperatorTypes_1.OperatorTypes.isNone:
                    return feat == null;
                case OperatorTypes_1.OperatorTypes.isNotNone:
                    return feat != null;
                case OperatorTypes_1.OperatorTypes.isGreaterThan:
                    return feat > operand;
                case OperatorTypes_1.OperatorTypes.isLessThan:
                    return feat < operand;
                case OperatorTypes_1.OperatorTypes.eqTo:
                    return feat === operand;
                case OperatorTypes_1.OperatorTypes.notEqTo:
                    return feat !== operand;
                default:
                    return false;
            }
        };
        try {
            const feat = getNestedObj(root);
            switch (this.operation.operator) {
                case OperatorTypes_1.OperatorTypes.and:
                    if (!this.operation.operations) {
                        return false;
                    }
                    for (let i = 0; i < this.operation.operations.length; i++) {
                        const pred = new Predicate({ feature: this.feature, operation: this.operation.operations[i] });
                        if (!pred.evaluate(root)) {
                            return false;
                        }
                    }
                    return true;
                case OperatorTypes_1.OperatorTypes.or:
                    if (!this.operation.operations) {
                        return false;
                    }
                    for (let i = 0; i < this.operation.operations.length; i++) {
                        const pred = new Predicate({ feature: this.feature, operation: this.operation.operations[i] });
                        if (pred.evaluate(root)) {
                            return true;
                        }
                    }
                    return false;
                default:
                    return testFeature(this.operation.operator, this.operation.operand, feat);
            }
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }
}
exports.default = Predicate;

import { OperatorTypes } from "./OperatorTypes";

export default class Operation{
    public operator: OperatorTypes;
    public operand?:any;
    public operations?:Array<Operation>;
}
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
/**
 * This is pointless at this point and could probably be removed, moving the style
 * up to the parent, but I'll have to admit I don't understand 100% how "context" and
 * "manager" work in react-dnd and what changed in its api since we needed this.
 */
class DNDContainer extends React.Component {
    render() {
        const { children, style } = this.props;
        const childCount = React.Children.count(children);
        if (childCount === 0) {
            // should this be reported as an error? it might just be the child Element
            // is disabled/hidden for whatever reason
            return null;
        }
        return (React.createElement("div", { style: style }, children));
    }
}
exports.default = DNDContainer;

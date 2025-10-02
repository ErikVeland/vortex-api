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
const _ = __importStar(require("lodash"));
const React = __importStar(require("react"));
/**
 * image component that supports alternative images, using the first that renders
 * successfully
 */
function Image(props) {
    const { className, circle, srcs } = props;
    const [srcIdx, setSourceIndex] = React.useState(0);
    const errorCB = React.useCallback(() => {
        if (srcIdx + 1 < srcs.length) {
            setSourceIndex(srcIdx + 1);
        }
    }, []);
    const classes = [];
    if (circle === true) {
        classes.push('img-circle');
    }
    if (className !== undefined) {
        classes.push(className);
    }
    return (React.createElement("img", Object.assign({}, _.omit(props, ['srcs', 'circle']), { className: classes.join(' '), src: srcs[srcIdx], onError: errorCB })));
}
exports.default = Image;

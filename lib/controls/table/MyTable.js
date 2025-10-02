"use strict";
/**
 * replacement for the react table using
 * the css display classes 'table', 'table-row' and so on
 * instead of <table>, <tr>, ... for more flexibility
 */
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
exports.TD = exports.TR = exports.TH = exports.TBody = exports.THead = exports.Table = void 0;
const _ = __importStar(require("lodash"));
const React = __importStar(require("react"));
function Table(props) {
    const classes = ['table', 'xtable'].concat((props.className || '').split(' '));
    if (props.condensed === true) {
        classes.push('table-condensed');
    }
    if (props.hover === true) {
        classes.push('table-hover');
    }
    return (React.createElement("table", { style: Object.assign({}, props.style), className: classes.join(' ') }, props.children));
}
exports.Table = Table;
function THead(props) {
    const classes = ['table-header', 'xthead'].concat((props.className || '').split(' '));
    return (React.createElement("thead", { style: Object.assign({}, props.style), className: classes.join(' '), ref: props.domRef }, props.children));
}
exports.THead = THead;
function TBody(props) {
    const classes = ['xtbody'].concat((props.className || '').split(' '));
    return (React.createElement("tbody", { style: Object.assign({}, props.style), className: classes.join(' '), ref: props.domRef }, props.children));
}
exports.TBody = TBody;
class TH extends React.Component {
    render() {
        const { children, className, domRef, style } = this.props;
        const classes = ['table-header-cell', 'xth'].concat((className || '').split(' '));
        return (React.createElement("th", Object.assign({ style: Object.assign({}, style), className: classes.join(' '), ref: domRef }, _.omit(this.props, ['style', 'className', 'domRef'])), children));
    }
}
exports.TH = TH;
function TR(props) {
    const { className, domRef } = props;
    const classes = ['xtr'].concat((className || '').split(' '));
    return (React.createElement("tr", Object.assign({ className: classes.join(' '), ref: domRef }, _.omit(props, ['className', 'domRef'])), props.children));
}
exports.TR = TR;
function TD(props) {
    const classes = ['xtd'].concat((props.className || '').split(' '));
    return (React.createElement("td", Object.assign({ className: classes.join(' ') }, _.omit(props, ['className', 'domRef']), { ref: props.domRef }), props.children));
}
exports.TD = TD;

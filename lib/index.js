"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.looksLike = exports.assertLooksLike = exports.Wildcard = void 0;
var jsdiff = require("diff");
function Wildcard() {
    return {
        sel: '',
        elm: undefined,
        text: undefined,
        key: undefined,
        children: [],
        data: {
            isWildcard: true,
        },
    };
}
exports.Wildcard = Wildcard;
function isWildcard(vnode) {
    return typeof vnode === 'object' && vnode.data && vnode.data.isWildcard;
}
function assertLooksLike(actual, expected, longError) {
    if (longError === void 0) { longError = false; }
    function prettyPrintError(message) {
        return function (actual, expected) {
            var a = removeGrandchildren(actual);
            var e = isWildcard(expected)
                ? expected
                : removeGrandchildren(expected);
            var eString = isWildcard(e)
                ? 'WILDCARD'
                : JSON.stringify(e, null, 2);
            var aString = JSON.stringify(a, null, 2);
            return (message +
                '\n' +
                jsdiff
                    .createTwoFilesPatch('', '', eString, aString, '', '')
                    .split('\n')
                    .slice(5)
                    .filter(function (s) { return s.indexOf('No newline at end of file') === -1; })
                    .filter(function (s) {
                    return !(s.startsWith('-') && s.indexOf('WILDCARD') !== -1);
                })
                    .map(function (s) {
                    return !(s.startsWith('+') || s.startsWith('-'))
                        ? '         ' + s
                        : s;
                })
                    .map(function (s) {
                    return s.startsWith('-') ? 'expected: ' + s.slice(1) : s;
                })
                    .map(function (s) {
                    return s.startsWith('+') ? 'actual:   ' + s.slice(1) : s;
                })
                    .join('\n') +
                (longError
                    ? '\n\n' +
                        'actual:\n' +
                        aString +
                        '\n\n' +
                        'expected:\n' +
                        eString
                    : ''));
        };
    }
    var e1 = 'Wildcards are only allowed in the expected vtree';
    var e2 = prettyPrintError('Text node mismatched');
    var e3 = prettyPrintError('Cannot compare different types');
    var e4 = prettyPrintError('Text property not matching');
    var e5 = prettyPrintError('Node selectors are not matching');
    var e6 = prettyPrintError('Not enough children');
    var e7 = 'Two consequtive wildcards are not allowed';
    var e8 = prettyPrintError('Could not match children');
    var e9 = prettyPrintError('Children mismatched');
    var e10 = prettyPrintError('Attributes mismatched');
    if (isWildcard(actual)) {
        throw new Error(e1);
    }
    if (typeof actual === 'string' && typeof expected === 'string') {
        if (actual === expected) {
            return;
        }
        else {
            throw new Error(e2(actual, expected));
        }
    }
    else if (typeof actual === 'string' || typeof expected === 'string') {
        throw new Error(e3(actual, expected));
    }
    if (isObj(actual) && isWildcard(expected)) {
        return;
    }
    else if (isObj(actual) && isObj(expected)) {
        var actualSels_1 = (actual.sel || '').split(/\.|#/);
        var expectedSels = (expected.sel || '').split(/\.|#/);
        var isSubset = expectedSels.reduce(function (acc, curr) { return acc && actualSels_1.indexOf(curr) !== -1; }, true);
        if (isSubset) {
            if (actual.text !== expected.text) {
                throw new Error(e4(actual, expected));
            }
            if (!objectMatches(actual.data, expected.data)) {
                throw new Error(e10(actual, expected));
            }
        }
        else {
            throw new Error(e5(actual, expected));
        }
        if (Array.isArray(actual.children) &&
            Array.isArray(expected.children)) {
            if (expected.children.filter(function (s) { return !isWildcard(s); }).length >
                actual.children.length) {
                throw new Error(e6(actual, expected));
            }
            if (expected.children.reduce(function (a, c) {
                return a == 1
                    ? isWildcard(c)
                        ? 2
                        : 0
                    : a === 2
                        ? 2
                        : isWildcard(c)
                            ? 1
                            : 0;
            }, 0) === 2) {
                throw new Error(e7);
            }
            var tries = replicateWildcards(actual.children, expected.children);
            var success = true;
            var lastError = '';
            for (var i = 0; i < tries.length; i++) {
                success = true;
                if (tries[i].length !== actual.children.length) {
                    throw new Error(e9(tries[i].length, actual.children.length));
                }
                for (var j = 0; j < tries[i].length; j++) {
                    try {
                        assertLooksLike(actual.children[j], tries[i][j], longError);
                    }
                    catch (e) {
                        lastError = e.message;
                        success = false;
                        break;
                    }
                }
                if (success) {
                    break;
                }
            }
            if (!success) {
                throw new Error(lastError);
            }
        }
    }
}
exports.assertLooksLike = assertLooksLike;
function removeGrandchildren(vnode) {
    return __assign(__assign({}, vnode), { children: vnode.children
            ? vnode.children
                .map(function (c) {
                return typeof c === 'object'
                    ? __assign(__assign({}, c), { children: '...' }) : c;
            })
                .map(function (c) { return (isWildcard(c) ? 'WILDCARD' : c); })
            : [] });
}
function objectMatches(actual, expected) {
    if (expected === undefined) {
        return true;
    }
    if (typeof expected !== typeof actual) {
        return false;
    }
    if (typeof actual === 'object' && typeof expected === 'object') {
        for (var k in expected) {
            if (!objectMatches(actual[k], expected[k])) {
                return false;
            }
        }
        return true;
    }
    if (Array.isArray(expected) && Array.isArray(actual)) {
        if (expected.length === actual.length) {
            for (var i = 0; i < expected.length; i++) {
                if (!objectMatches(actual[i], expected[i])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    return actual === expected;
}
function splitOn(arr, div) {
    var i = arr.map(div).indexOf(true);
    if (i === -1) {
        return [arr];
    }
    return [arr.slice(0, i)].concat(splitOn(arr.slice(i + 1), div));
}
function replicateWildcards(actual, expected) {
    var n = expected.filter(isWildcard).length;
    var k = actual.length - (expected.length - n);
    if (k === 0 || n === 0) {
        return [expected.filter(function (e) { return !isWildcard(e); })];
    }
    var split = splitOn(expected, isWildcard);
    var distributions = getDistributions(Array(n).fill(0), k);
    var result = [];
    for (var i = 0; i < distributions.length; i++) {
        var curr = split[0];
        for (var j = 0; j < distributions[i].length; j++) {
            curr = curr.concat(Array(distributions[i][j]).fill(Wildcard()));
            curr = curr.concat(split[j + 1]);
        }
        result.push(curr);
    }
    return result;
}
function getDistributions(arr, k) {
    if (k === 0) {
        return [arr];
    }
    var n = arr.length;
    var result = [];
    for (var i = 0; i < n; i++) {
        var a = arr.slice(0);
        a[i]++;
        result = result.concat(getDistributions(a, k - 1));
    }
    return result;
}
function isObj(a) {
    return typeof a === 'object';
}
function looksLike(actual, expected) {
    try {
        assertLooksLike(actual, expected);
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.looksLike = looksLike;
//# sourceMappingURL=index.js.map